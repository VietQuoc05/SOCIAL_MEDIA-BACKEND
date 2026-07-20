import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Follow } from '../../database/entities/follow.entity';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    private gateway: EventsGateway,
  ) {}

  async findByRecipient(recipientId: string, filter: string) {
    const query = this.repo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :recipientId', { recipientId });

    if (filter === 'follow') {
      query.andWhere('notification.type IN (:...types)', {
        types: [NotificationType.FOLLOW_REQUEST, NotificationType.FOLLOW_ACCEPTED],
      });
    } else if (filter === 'comments') {
      query.andWhere('notification.type = :type', {
        type: NotificationType.COMMENT_REPLY,
      });
    }

    query.orderBy('notification.createdAt', 'DESC');

    return query.getMany();
  }

  async getUnreadCount(recipientId: string) {
    return this.repo.count({
      where: { recipientId, isRead: false },
    });
  }

  async markAsRead(recipientId: string, notificationId: string) {
    const notification = await this.repo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientId !== recipientId) {
      throw new ForbiddenException('Not your notification');
    }

    notification.isRead = true;
    await this.repo.save(notification);

    return { success: true };
  }

  async markAllAsRead(recipientId: string) {
    await this.repo.update(
      { recipientId, isRead: false },
      { isRead: true },
    );

    return { success: true };
  }

  async create(data: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
    commentId?: string;
  }) {
    if (data.recipientId === data.actorId) {
      return null;
    }

    if (data.type === NotificationType.FOLLOW_REQUEST) {
      await this.repo.update(
        {
          recipientId: data.recipientId,
          actorId: data.actorId,
          type: NotificationType.FOLLOW_REQUEST,
          isRead: false,
        },
        { isRead: true },
      );
    }

    const notification = this.repo.create({
      recipientId: data.recipientId,
      actorId: data.actorId,
      type: data.type,
      postId: data.postId || null,
      commentId: data.commentId || null,
    });

    const saved = await this.repo.save(notification);

    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['actor'],
    });

    this.gateway.emitNotification(withRelations);

    return withRelations;
  }

  async markReadByTypeAndActor(
    recipientId: string,
    actorId: string,
    type: NotificationType,
  ) {
    await this.repo.update(
      {
        recipientId,
        actorId,
        type,
        isRead: false,
      },
      { isRead: true },
    );
  }
}
