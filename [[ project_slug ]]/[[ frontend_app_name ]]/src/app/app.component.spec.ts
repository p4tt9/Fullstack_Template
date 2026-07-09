import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/hello').flush({ message: 'Hello World' });

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the [[ backend_artifact_id ]] response', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/hello').flush({ message: 'Hello World' });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status strong')?.textContent).toContain('Hello World');
  });
});
