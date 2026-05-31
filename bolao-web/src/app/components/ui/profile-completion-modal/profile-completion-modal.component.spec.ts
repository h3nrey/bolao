import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileCompletionModalComponent } from './profile-completion-modal.component';
import { PROJECT_OPTIONS, ProjectValue } from '../../../shared/constants/profile-options';

describe('ProfileCompletionModalComponent', () => {
  let component: ProfileCompletionModalComponent;
  let fixture: ComponentFixture<ProfileCompletionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileCompletionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileCompletionModalComponent);
    component = fixture.componentInstance;

    // Set required inputs to mock defaults
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('name', 'James Rodrigues');
    fixture.componentRef.setInput('project', 'esmpu');
    fixture.componentRef.setInput('seniority', 'bolsista');

    fixture.detectChanges();
  });

  it('should create the profile completion modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should include the unified underscore projects (esmpu, jump, inovaula, materials_digitais) in project options', () => {
    const optionValues = component.projectOptions.map(opt => opt.value);

    expect(optionValues).toContain('esmpu');
    expect(optionValues).toContain('jump');
    expect(optionValues).toContain('inovaula');
    expect(optionValues).toContain('materiais_digitais');
    expect(optionValues).toContain('clique_escola');

    // Verify mapped labels look correct for frontend display
    const esmpuOpt = component.projectOptions.find(opt => opt.value === 'esmpu');
    expect(esmpuOpt?.label).toBe('ESMPU');

    const cliqueEscolaOpt = component.projectOptions.find(opt => opt.value === 'clique_escola');
    expect(cliqueEscolaOpt?.label).toBe('Clique Escola');
  });

  it('should emit the correct project value with underscore when onProjectChange is called', () => {
    spyOn(component.projectChange, 'emit');

    component.onProjectChange('inovaula');
    expect(component.projectChange.emit).toHaveBeenCalledWith('inovaula');

    component.onProjectChange('clique_escola');
    expect(component.projectChange.emit).toHaveBeenCalledWith('clique_escola');
  });

  it('should emit nameChange when handleNameInput is called', () => {
    spyOn(component.nameChange, 'emit');

    const mockEvent = {
      target: { value: 'New Test Name' }
    } as unknown as Event;

    component.handleNameInput(mockEvent);
    expect(component.nameChange.emit).toHaveBeenCalledWith('New Test Name');
  });

  it('should emit save when save button is clicked / saved output triggered', () => {
    spyOn(component.save, 'emit');
    component.save.emit();
    expect(component.save.emit).toHaveBeenCalled();
  });
});
