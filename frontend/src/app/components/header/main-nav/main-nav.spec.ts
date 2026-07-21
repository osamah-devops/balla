import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainNav } from './main-nav';

describe('MainNav', () => {
  let component: MainNav;
  let fixture: ComponentFixture<MainNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNav],
    }).compileComponents();

    fixture = TestBed.createComponent(MainNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
