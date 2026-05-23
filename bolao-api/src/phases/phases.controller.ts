import { Controller, Get, Post, Patch, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { PhasesService } from './phases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createPhaseSchema, updatePhaseStatusSchema, CreatePhaseDto, UpdatePhaseStatusDto } from './dto/phase.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(private phasesService: PhasesService) {}

  @Get('phases/:id')
  async findOne(@Param('id') id: string) {
    return this.phasesService.findOne(id);
  }

  @Post('tournaments/:tournamentId/phases')
  @UsePipes(new ZodValidationPipe(createPhaseSchema))
  async create(
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreatePhaseDto,
  ) {
    return this.phasesService.create(tournamentId, dto);
  }

  @Patch('phases/:id')
  @UsePipes(new ZodValidationPipe(updatePhaseStatusSchema))
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePhaseStatusDto,
  ) {
    return this.phasesService.updateStatus(id, dto);
  }
}
