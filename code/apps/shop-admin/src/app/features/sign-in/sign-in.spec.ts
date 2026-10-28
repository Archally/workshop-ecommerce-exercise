import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { SessionService } from '../../core/operators/session.service';
import { SignIn } from './sign-in';

const TOKEN_KEY = 'shop-admin.sessionToken';

const OPERATOR = {
  id: 'operator-4',
  name: 'Nina Osei',
  email: 'nina.osei@example.com',
  role: 'administrator',
  isActive: true,
};

describe('SignIn', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Landing on /products loads that page, which fetches; drain it before verify.
    httpMock.match(() => true).forEach((request) => request.flush([]));
    httpMock.verify();
    window.localStorage.clear();
  });

  function fill(root: HTMLElement, login: string, password: string): void {
    const inputs = Array.from(root.querySelectorAll('input')) as HTMLInputElement[];
    const [loginInput, passwordInput] = inputs;
    loginInput.value = login;
    loginInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
  }

  it('signs an operator in, remembers the token and leaves the sign-in screen', async () => {
    const fixture = TestBed.createComponent(SignIn);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'nina.osei@example.com', 'operator-demo-2026');
    await fixture.whenStable();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    const request = httpMock.expectOne('http://localhost:3003/operators/sign-in');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      login: 'nina.osei@example.com',
      password: 'operator-demo-2026',
    });
    request.flush({ token: 'a-live-token', operator: OPERATOR });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();

    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('a-live-token');
    expect(TestBed.inject(SessionService).signedIn()).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('a refused sign-in says so, remembers nothing, and never names which half was wrong', async () => {
    const fixture = TestBed.createComponent(SignIn);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'nina.osei@example.com', 'wrong-pass-2026');
    await fixture.whenStable();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    httpMock
      .expectOne('http://localhost:3003/operators/sign-in')
      .flush({ error: 'Login or password is incorrect' }, { status: 401, statusText: 'Unauthorized' });

    await fixture.whenStable();
    fixture.detectChanges();

    const refusal = root.querySelector('[role="alert"]');
    expect(refusal?.textContent?.trim()).toBe('Login or password is incorrect.');
    expect(refusal?.textContent ?? '').not.toMatch(/unknown|no such|wrong password/i);

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(TestBed.inject(SessionService).signedIn()).toBe(false);
  });

  it('will not call the service when either half is blank', async () => {
    const fixture = TestBed.createComponent(SignIn);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'nina.osei@example.com', '');
    await fixture.whenStable();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(httpMock.match(() => true).length).toBe(0);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('both a login and a password');
  });
});
