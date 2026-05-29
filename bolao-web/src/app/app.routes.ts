import { Routes } from '@angular/router';
import { RankingComponent } from './pages/ranking/ranking.component';
import { ParticipantesComponent } from './pages/participantes/participantes.component';
import { PartidasComponent } from './pages/partidas/partidas.component';
import { CartelaComponent } from './pages/cartela/cartela.component';
import { RegrasComponent } from './pages/regras/regras.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

export const routes: Routes = [
  { path: 'ranking', component: RankingComponent },
  { path: 'participantes', component: ParticipantesComponent },
  { path: 'partidas', component: PartidasComponent },
  { path: 'cartela', component: CartelaComponent },
  { path: 'regras', component: RegrasComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'perfil/:id', component: PerfilComponent },
  { path: '', redirectTo: 'ranking', pathMatch: 'full' },
  { path: '**', redirectTo: 'ranking' }
];
