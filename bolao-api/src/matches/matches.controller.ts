import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UsePipes } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createMatchSchema, CreateMatchDto } from './dto/match.dto';
import {
  createExtraPeriodSchema, updateExtraPeriodSchema,
  CreateExtraPeriodDto, UpdateExtraPeriodDto,
} from './dto/match-extra-period.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('matches')
  async findAll(
    @Query('phase_id') phaseId?: string,
    @Query('status') status?: string,
    @Query('group_id') groupId?: string,
  ) {
    return this.matchesService.findAll(phaseId, status, groupId);
  }

  @Get('matches/:id')
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Post('phases/:phaseId/matches')
  @UsePipes(new ZodValidationPipe(createMatchSchema))
  async create(
    @Param('phaseId') phaseId: string,
    @Body() dto: CreateMatchDto,
  ) {
    return this.matchesService.create(phaseId, dto);
  }

  @Patch('matches/:id/start')
  async start(@Param('id') id: string) {
    return this.matchesService.start(id);
  }

  @Patch('matches/:id/end')
  async end(@Param('id') id: string) {
    return this.matchesService.end(id);
  }

  @Post('matches/:matchId/extra-periods')
  @UsePipes(new ZodValidationPipe(createExtraPeriodSchema))
  async createExtraPeriod(
    @Param('matchId') matchId: string,
    @Body() dto: CreateExtraPeriodDto,
  ) {
    return this.matchesService.createExtraPeriod(matchId, dto);
  }

  @Patch('extra-periods/:id')
  @UsePipes(new ZodValidationPipe(updateExtraPeriodSchema))
  async updateExtraPeriod(
    @Param('id') id: string,
    @Body() dto: UpdateExtraPeriodDto,
  ) {
    return this.matchesService.updateExtraPeriod(id, dto);
  }
}
