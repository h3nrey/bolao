import { Controller, Get, Post, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createTeamSchema, CreateTeamDto } from './dto/team.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  async findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createTeamSchema))
  async create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }
}
