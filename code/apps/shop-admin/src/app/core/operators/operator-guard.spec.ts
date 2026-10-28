import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { SessionService } from './session.service';

const TOKEN_KEY = 'shop-admin.sessionToken';

// The guard runs in a microtask after navigateByUrl returns, so a synchronous
// expectOne right after it would look at an empty backend.
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const OPERATOR = {
  id: 'operator-4',
  name: 'Nina Osei',
  email: 'nina.osei@example.com',
  role: 'administrator',
  isActive: true,
};

describe('back-office routes closed to a visitor who is not signed in', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((request) => request.flush([]));
    window.localStorage.clear();
  });

  for (const path of ['/products', '/orders', '/customers', '/products/product-1']) {
    it(`sends a signed-out visitor at ${path} to the sign-in screen`, async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      await router.navigateByUrl(path);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(router.url).toBe('/sign-in');

      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain('The back office is closed until an operator signs in.');
      // No nav to click past: the gate is the whole window.
      expect(root.querySelector('.shell__nav-link')).toBeNull();
    });
  }

  it('lets a visitor carrying a live remembered token through, and shows who they are', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'a-remembered-token');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const navigation = router.navigateByUrl('/customers');
    await settle();

    const sessionRequest = httpMock.expectOne('http://localhost:3003/operators/session');
    expect(sessionRequest.request.method).toBe('GET');
    expect(sessionRequest.request.headers.get('Authorization')).toBe('Bearer a-remembered-token');
    sessionRequest.flush(OPERATOR);

    await navigation;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/customers');
    expect(TestBed.inject(SessionService).signedIn()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nina Osei');
  });

  it('drops a remembered token the service refuses and shows the sign-in screen', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'a-revoked-token');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const navigation = router.navigateByUrl('/customers');
    await settle();

    httpMock
      .expectOne('http://localhost:3003/operators/session')
      .flush({ error: 'No live operator session' }, { status: 401, statusText: 'Unauthorized' });

    await navigation;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/sign-in');
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
