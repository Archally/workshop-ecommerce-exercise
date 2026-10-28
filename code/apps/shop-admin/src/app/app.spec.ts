import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { SessionService } from './core/operators/session.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Shop Admin wordmark and the three primary nav links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Shop Admin');

    const links = Array.from(root.querySelectorAll('.shell__nav-label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(links).toEqual(['Products', 'Orders', 'Customers']);
  });

  it('shows the current section name in the top bar after navigating', async () => {
    // Signed in first: every route but /sign-in carries operatorGuard, so a
    // navigation made without a session never reaches the section it names.
    TestBed.inject(SessionService).signIn('nina.osei@example.com', 'operator-demo-2026').subscribe();
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:3003/operators/sign-in').flush({
      token: 'a-live-token',
      operator: {
        id: 'operator-4',
        name: 'Nina Osei',
        email: 'nina.osei@example.com',
        role: 'administrator',
        isActive: true,
      },
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/orders');
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.shell__section')?.textContent?.trim()).toBe('Orders');

    // OrderList issued a request while loading; drain it so httpMock.verify() (if any) is clean.
    httpMock.match(() => true).forEach((req) => req.flush([]));
  });
});
