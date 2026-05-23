import { Controller, Get, Post, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { BracketService } from './bracket.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createBracketSlotSchema, CreateBracketSlotDto } from './dto/bracket.dto';

@Controller('bracket')
@UseGuards(JwtAuthGuard)
export class BracketController {
  constructor(private bracketService: BracketService) {}

  @Get(':phaseId')
  async getBracket(@Param('phaseId') phaseId: string) {
    return this.bracketService.getBracket(phaseId);
  }

  @Post(':phaseId/slots')
  @UsePipes(new ZodValidationPipe(createBracketSlotSchema))
  async createSlot(
    @Param('phaseId') phaseId: string,
    @Body() dto: CreateBracketSlotDto,
  ) {
    return this.bracketService.createSlot(phaseId, dto);
  }

  @Post('resolve/:phaseId')
  async resolve(@Param('phaseId') phaseId: string) {
    return this.bracketService.resolve(phaseId);
  }
}
