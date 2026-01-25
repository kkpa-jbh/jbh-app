import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../logging/logger.service';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private fcmToken = new BehaviorSubject<string | null>(null);
  public fcmToken$: Observable<string | null> = this.fcmToken.asObservable();

  private lastNotification = new BehaviorSubject<PushNotificationSchema | null>(null);
  public lastNotification$: Observable<PushNotificationSchema | null> = this.lastNotification.asObservable();

  constructor(
    private platform: Platform,
    private logger: LoggerService
  ) {}

  /**
   * Initialize push notifications (call this on app startup)
   * This method should be called in AppComponent or similar
   */
  async initialize(): Promise<void> {
    // Only initialize on native platforms
    if (!this.platform.is('hybrid')) {
      this.logger.info('Push Notifications: Skipping initialization (not a native app)');
      return;
    }

    try {
      // Request permission to use push notifications
      const result = await PushNotifications.requestPermissions();

      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();

        // Set up listeners
        this.setupListeners();

        this.logger.info('Push Notifications: Initialized successfully');
      } else {
        this.logger.warn('Push Notifications: Permission denied', 'PushNotification');
      }
    } catch (error) {
      this.logger.error('Push Notifications: Initialization error', 'PushNotification', error);
    }
  }

  /**
   * Set up push notification event listeners
   */
  private setupListeners(): void {
    // On successful registration, get FCM token
    PushNotifications.addListener('registration', (token: Token) => {
      this.logger.info('Push Notifications: FCM Token received', 'PushNotification', token.value);
      this.fcmToken.next(token.value);

      // TODO: Send this token to your Java microservice
      // Example: this.sendTokenToBackend(token.value);
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      this.logger.error('Push Notifications: Registration error', 'PushNotification', error);
    });

    // Handle notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      this.logger.info('Push Notifications: Received in foreground', 'PushNotification', notification);
      this.lastNotification.next(notification);

      // Show local notification or update UI
      this.handleForegroundNotification(notification);
    });

    // Handle notification action (user tapped on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      this.logger.info('Push Notifications: Action performed', 'PushNotification', action);
      this.lastNotification.next(action.notification);

      // Navigate to specific screen based on notification data
      this.handleNotificationAction(action);
    });
  }

  /**
   * Handle notification received while app is open (foreground)
   * Override this method or subscribe to lastNotification$ to customize behavior
   */
  private handleForegroundNotification(notification: PushNotificationSchema): void {
    // Default behavior: just log
    // You can show a toast, alert, or update UI here
    this.logger.debug('Foreground notification:', 'PushNotification', notification.title, notification.body);
  }

  /**
   * Handle user tapping on a notification
   * Override this method to navigate to specific screens
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;

    // Example: Navigate based on notification type
    if (data.type === 'order') {
      this.logger.debug('Navigate to order:', 'PushNotification', data.orderId);
      // this.router.navigate(['/orders', data.orderId]);
    } else if (data.type === 'message') {
      this.logger.debug('Navigate to messages', 'PushNotification');
      // this.router.navigate(['/messages']);
    }

    // Default: open home screen
    this.logger.debug('Notification action performed with data:', 'PushNotification', data);
  }

  /**
   * Get the current FCM token
   */
  getCurrentToken(): string | null {
    return this.fcmToken.value;
  }

  /**
   * Send FCM token to your backend
   * Call this method after receiving the token
   */
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      // TODO: Replace with your actual API endpoint
      // Example:
      // await this.http.post('/api/devices/register', {
      //   token: token,
      //   platform: this.platform.is('ios') ? 'ios' : 'android'
      // }).toPromise();

      this.logger.debug('TODO: Send token to backend:', 'PushNotification', token);
    } catch (error) {
      this.logger.error('Error sending token to backend:', 'PushNotification', error);
    }
  }

  /**
   * Remove all delivered notifications from notification center
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications();
  }

  /**
   * Get list of delivered notifications
   */
  async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }
}
