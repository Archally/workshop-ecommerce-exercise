import { TestBed } from '@angular/core/testing';
import { ActivityLogService } from './activity-log.service';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityLogService);
  });

  it('starts empty, with no last change', () => {
    expect(service.recent()).toEqual([]);
    expect(service.lastChange()).toBeNull();
  });

  it('records the newest entry first', () => {
    service.record('info', 'first');
    service.record('transition', 'second');

    const entries = service.recent();
    expect(entries.length).toBe(2);
    expect(entries[0].message).toBe('second');
    expect(entries[0].kind).toBe('transition');
    expect(entries[1].message).toBe('first');
  });

  it('carries a structured transition alongside the message', () => {
    service.record('transition', 'Order order-1:', { from: 'pending', to: 'confirmed' });

    const [entry] = service.recent();
    expect(entry.transition).toEqual({ from: 'pending', to: 'confirmed' });
  });

  it('assigns each entry a distinct, increasing id', () => {
    service.record('info', 'a');
    service.record('info', 'b');

    const [newest, oldest] = service.recent();
    expect(newest.id).toBeGreaterThan(oldest.id);
  });

  it('caps the feed at 30 entries', () => {
    for (let index = 0; index < 35; index += 1) {
      service.record('info', `entry ${index}`);
    }

    expect(service.recent().length).toBe(30);
    expect(service.recent()[0].message).toBe('entry 34');
  });

  it('clears the feed', () => {
    service.record('info', 'a');
    service.clear();
    expect(service.recent()).toEqual([]);
  });

  it('flash() records which entity just changed', () => {
    service.flash('order-1');
    expect(service.lastChange()?.entityId).toBe('order-1');
  });
});
