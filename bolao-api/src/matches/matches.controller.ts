import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { FootballDataSyncService } from './football-data-sync.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createMatchSchema, CreateMatchDto, updateMatchSchema, UpdateMatchDto } from './dto/match.dto';
import {
  createExtraPeriodSchema,
  updateExtraPeriodSchema,
  CreateExtraPeriodDto,
  UpdateExtraPeriodDto,
} from './dto/match-extra-period.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(
    private matchesService: MatchesService,
    private syncService: FootballDataSyncService,
  ) {}

  @Post('matches/sync')
  @UseGuards(AdminGuard)
  async sync() {
    return this.syncService.syncMatches();
  }

  @Get('matches')
  async findAll(
    @Query('phase_id') phaseId?: string,
    @Query('status') status?: string,
    @Query('group_id') groupId?: string,
    @Query('sort') sort?: 'status' | 'chronological',
  ) {
    return this.matchesService.findAll(phaseId, status, groupId, sort);
  }

  @Get('matches/:id')
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Post('phases/:phaseId/matches')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(createMatchSchema))
  async create(@Param('phaseId') phaseId: string, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(phaseId, dto);
  }

  @Patch('matches/:id')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(updateMatchSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(id, dto);
  }

  @Delete('matches/:id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }

  @Patch('matches/:id/start')
  @UseGuards(AdminGuard)
  async start(@Param('id') id: string) {
    return this.matchesService.start(id);
  }

  @Patch('matches/:id/end')
  @UseGuards(AdminGuard)
  async end(@Param('id') id: string) {
    return this.matchesService.end(id);
  }

  @Post('matches/:matchId/extra-periods')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(createExtraPeriodSchema))
  async createExtraPeriod(
    @Param('matchId') matchId: string,
    @Body() dto: CreateExtraPeriodDto,
  ) {
    return this.matchesService.createExtraPeriod(matchId, dto);
  }

  @Patch('extra-periods/:id')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(updateExtraPeriodSchema))
  async updateExtraPeriod(
    @Param('id') id: string,
    @Body() dto: UpdateExtraPeriodDto,
  ) {
    return this.matchesService.updateExtraPeriod(id, dto);
  }
}
