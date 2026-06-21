import { Routes } from '@angular/router';
import { RankingComponent } from './pages/ranking/ranking.component';
import { ParticipantesComponent } from './pages/participantes/participantes.component';
import { PartidasComponent } from './pages/partidas/partidas.component';
import { MatchDetailComponent } from './pages/partidas/components/match-detail/match-detail.component';
import { CartelaComponent } from './pages/cartela/cartela.component';
import { CartelaGruposComponent } from './pages/cartela/components/cartela-grupos/cartela-grupos.component';
import { CartelaEliminatoriaComponent } from './pages/cartela/components/cartela-eliminatoria/cartela-eliminatoria.component';
import { EspeciaisComponent } from './pages/especiais/especiais.component';
import { RegrasComponent } from './pages/regras/regras.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: 'ranking', component: RankingComponent },
  { path: 'participantes', component: ParticipantesComponent },
  { path: 'partidas', component: PartidasComponent },
  { path: 'partidas/:id', component: MatchDetailComponent },
  { path: 'especiais', component: EspeciaisComponent },
  { path: 'regras', component: RegrasComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'perfil/:id', component: PerfilComponent },
  { path: 'admin', component: AdminComponent },
  { path: '', redirectTo: 'ranking', pathMatch: 'full' },
  { path: '**', redirectTo: 'ranking' }
];
