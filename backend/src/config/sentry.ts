import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { config } from './index';

export const initializeSentry = (app: Express) => {
  if (config.SENTRY_DSN) {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.NODE_ENV,
      tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    });

    // Request handler must be the first middleware
    app.use(Sentry.requestHandler());

    // Tracing handler creates a trace for every incoming request
    app.use(Sentry.tracingHandler());

    console.log('✅ Sentry initialized');
  } else {
    console.log('⚠️  Sentry DSN not provided, skipping initialization');
  }
};