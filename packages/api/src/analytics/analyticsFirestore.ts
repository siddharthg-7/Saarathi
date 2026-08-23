import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyAnalytics, WeeklyAnalytics, MonthlyAnalytics } from '@saarathi/types';

export class AnalyticsFirestoreService {
  /**
   * Save daily analytics aggregate in Firestore
   */
  public static async saveDailyAnalytics(userId: string, data: DailyAnalytics): Promise<void> {
    if (!db || !userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_daily', data.date);
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.warn('Failed to save daily analytics to Firestore:', e);
    }
  }

  /**
   * Fetch daily analytics aggregate from Firestore
   */
  public static async getDailyAnalytics(userId: string, date: string): Promise<DailyAnalytics | null> {
    if (!db || !userId) return null;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_daily', date);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as DailyAnalytics;
      }
    } catch (e) {
      console.warn('Failed to fetch daily analytics from Firestore:', e);
    }
    return null;
  }

  /**
   * Save weekly analytics aggregate in Firestore
   */
  public static async saveWeeklyAnalytics(userId: string, data: WeeklyAnalytics): Promise<void> {
    if (!db || !userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_weekly', data.weekId);
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.warn('Failed to save weekly analytics to Firestore:', e);
    }
  }

  /**
   * Fetch weekly analytics aggregate from Firestore
   */
  public static async getWeeklyAnalytics(userId: string, weekId: string): Promise<WeeklyAnalytics | null> {
    if (!db || !userId) return null;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_weekly', weekId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as WeeklyAnalytics;
      }
    } catch (e) {
      console.warn('Failed to fetch weekly analytics from Firestore:', e);
    }
    return null;
  }

  /**
   * Save monthly analytics aggregate in Firestore
   */
  public static async saveMonthlyAnalytics(userId: string, data: MonthlyAnalytics): Promise<void> {
    if (!db || !userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_monthly', data.monthId);
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.warn('Failed to save monthly analytics to Firestore:', e);
    }
  }

  /**
   * Fetch monthly analytics aggregate from Firestore
   */
  public static async getMonthlyAnalytics(userId: string, monthId: string): Promise<MonthlyAnalytics | null> {
    if (!db || !userId) return null;
    try {
      const docRef = doc(db, 'users', userId, 'analytics_monthly', monthId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as MonthlyAnalytics;
      }
    } catch (e) {
      console.warn('Failed to fetch monthly analytics from Firestore:', e);
    }
    return null;
  }
}
