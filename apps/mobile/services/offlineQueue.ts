/**
 * Offline Queue Service
 * Handles queuing shipment updates when offline and syncs when online
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SHIPMENT_STATUSES,
  SHIPMENT_TRANSITIONS,
  type ShipmentStatus,
} from "@infamous-freight/shared";

interface QueuedAction {
  id: string;
  type: "shipment_update" | "shipment_create" | "status_change";
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "@offline_queue";
const MAX_RETRIES = 3;
const SHIPMENT_STATUS_SET = new Set<string>(SHIPMENT_STATUSES);

export class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private isProcessing = false;

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
    }
  }

  async addToQueue(type: QueuedAction["type"], payload: any): Promise<string> {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(action);
    await this.persistQueue();
    return action.id;
  }

  async processQueue(apiClient: any): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const failedActions: QueuedAction[] = [];

    for (const action of this.queue) {
      try {
        await this.processAction(action, apiClient);
      } catch (error) {
        action.retries++;
        if (action.retries < MAX_RETRIES) {
          failedActions.push(action);
        } else {
          console.error("Action failed after max retries:", action, error);
        }
      }
    }

    this.queue = failedActions;
    await this.persistQueue();
    this.isProcessing = false;
  }

  private async processAction(action: QueuedAction, apiClient: any): Promise<void> {
    switch (action.type) {
      case "shipment_update":
        await apiClient.updateShipment(action.payload.id, action.payload.updates);
        break;
      case "shipment_create":
        await apiClient.createShipment(action.payload);
        break;
      case "status_change":
        this.assertValidStatusChange(action.payload);
        await apiClient.updateShipmentStatus(action.payload.id, action.payload.status);
        break;
    }
  }

  private assertValidStatusChange(payload: {
    id?: string;
    status?: string;
    currentStatus?: string;
  }): void {
    if (!payload?.status || !SHIPMENT_STATUS_SET.has(payload.status)) {
      throw new Error(`Invalid queued shipment status: ${payload?.status ?? "unknown"}`);
    }

    if (!payload.currentStatus || payload.currentStatus === payload.status) {
      return;
    }

    if (!SHIPMENT_STATUS_SET.has(payload.currentStatus)) {
      throw new Error(`Invalid queued shipment currentStatus: ${payload.currentStatus}`);
    }

    const allowedNext = SHIPMENT_TRANSITIONS[payload.currentStatus as ShipmentStatus] || [];
    if (!allowedNext.includes(payload.status as ShipmentStatus)) {
      throw new Error(
        `Invalid queued transition from ${payload.currentStatus} to ${payload.status}`,
      );
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to persist queue:", error);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
  }
}

export const offlineQueue = new OfflineQueueService();
