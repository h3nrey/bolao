import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UsePipes } from '@nestjs/common';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createPlayerSchema, updatePlayerSchema, CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Get()
  async findAll(@Query('team_id') teamId?: string) {
    return this.playersService.findAll(teamId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPlayerSchema))
  async create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updatePlayerSchema))
  async update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }
}
