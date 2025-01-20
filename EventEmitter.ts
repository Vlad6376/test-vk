class EventEmitter {
    private listeners: { [eventName: string]: Function[] } = {};

    on(eventName: string, listener: Function): void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(listener);
    }

    emit(eventName: string, ...args: any[]): void {
        const eventListeners = this.listeners[eventName];
        if (eventListeners) {
        eventListeners.forEach(listener => listener(...args));
        }
    }

    off(eventName: string, listenerToRemove: Function): void {
        const eventListeners = this.listeners[eventName];
        if (eventListeners) {
            this.listeners[eventName] = eventListeners.filter(listener => listener !== listenerToRemove);
        }
    }
}

const emitter = new EventEmitter();

const logData = (data: string) => {
    console.log(data);
};

emitter.on('data', logData);

emitter.emit('data', 'some data');

emitter.off('myEvent', logData);
