import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AnnouncementAudienceDTO,
  CreateAnnouncementRequestDTO,
  USER_SERVICE,
} from '@app/contracts';
import { AnnouncementService } from '../services/announcement.service';

@Controller()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @MessagePattern(USER_SERVICE.ACTIONS.ANNOUNCEMENT_PREVIEW)
  preview(@Payload() payload: AnnouncementAudienceDTO) {
    return this.announcementService.preview(payload);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.ANNOUNCEMENT_SEND)
  send(
    @Payload()
    payload: {
      actorId: string;
      dto: CreateAnnouncementRequestDTO;
    },
  ) {
    return this.announcementService.send(payload.actorId, payload.dto);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.ANNOUNCEMENT_FIND_ALL)
  findAll() {
    return this.announcementService.findAll();
  }
}
