import { Controller, Get, Post, Patch, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createGroupSchema, addTeamSchema, setFinalPositionSchema, CreateGroupDto, AddTeamDto, SetFinalPositionDto } from './dto/group.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get('groups/:id')
  async findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post('phases/:phaseId/groups')
  @UsePipes(new ZodValidationPipe(createGroupSchema))
  async create(
    @Param('phaseId') phaseId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.create(phaseId, dto);
  }

  @Post('groups/:id/teams')
  @UsePipes(new ZodValidationPipe(addTeamSchema))
  async addTeam(
    @Param('id') id: string,
    @Body() dto: AddTeamDto,
  ) {
    return this.groupsService.addTeam(id, dto);
  }

  @Patch('groups/:groupId/teams/:teamId')
  @UsePipes(new ZodValidationPipe(setFinalPositionSchema))
  async setFinalPosition(
    @Param('groupId') groupId: string,
    @Param('teamId') teamId: string,
    @Body() dto: SetFinalPositionDto,
  ) {
    return this.groupsService.setFinalPosition(groupId, teamId, dto);
  }
}
