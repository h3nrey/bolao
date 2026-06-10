import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createTeamSchema,
  CreateTeamDto,
  updateTeamSchema,
  UpdateTeamDto,
  deleteTeamsSchema,
  DeleteTeamsDto,
} from './dto/team.dto';

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
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(createTeamSchema))
  async create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(updateTeamSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete()
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(deleteTeamsSchema))
  async deleteBulk(@Body() dto: DeleteTeamsDto) {
    const result = await this.teamsService.removeBulk(dto.ids);
    return { success: true, deletedCount: result.count };
  }
}
