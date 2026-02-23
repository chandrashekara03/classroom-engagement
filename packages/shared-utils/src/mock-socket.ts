import { EventEmitter } from 'events';

class MockSocketServer extends EventEmitter {
  private channel: BroadcastChannel;
  private id: string;
  private connectedClients: Set<string> = new Set();
  public state: Record<string, unknown> = {};

  constructor(namespace: string) {
    super();
    this.id = Math.random().toString(36).substring(7);
    this.channel = new BroadcastChannel(`socket-${namespace}`);
    
    this.channel.onmessage = (event) => {
      const { emitType, payload, senderId } = event.data;
      if (senderId === this.id) return;
      this.emit(emitType, payload);
    };
  }

  public connect() {
    setTimeout(() => {
      this.emit('connect');
    }, 100);
  }

  public disconnect() {
    this.emit('disconnect');
    this.channel.close();
  }

  public sendEmit(event: string, ...args: unknown[]) {
    this.channel.postMessage({
      emitType: event,
      payload: args[0],
      senderId: this.id
    });
    // the local instance doesn't receive its own broadcast channel message unless it emits to itself
  }
}

// A singleton instance factory per namespace
const instances: Record<string, MockSocketServer> = {};

export function createMockSocket(url: string, namespace: string = 'classroom') {
  if (typeof window === 'undefined') return new MockSocketServer(namespace); // SSR safe
  if (!instances[namespace]) {
    instances[namespace] = new MockSocketServer(namespace);
  }
  return instances[namespace];
}

export function usePrototypeSocket(namespace: string = 'classroom') {
  void namespace;
  // A wrapper for React hooks, to be exported from apps
  // Not creating the hook here to avoid React deps in shared-utils,
  // returning the factory.
}
