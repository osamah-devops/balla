import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileMenuButton } from './mobile-menu-button';

describe('MobileMenuButton', () => {
  let component: MobileMenuButton;
  let fixture: ComponentFixture<MobileMenuButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileMenuButton],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileMenuButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
