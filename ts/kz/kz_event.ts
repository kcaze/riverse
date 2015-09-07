module kz {
  var events: Array<Event> = [];
  export class Event {
    type: string;
    data: any;
    constructor(type: string, data = {}) {
      this.type = type;
      this.data = data;
    }

    static sendEvent(event: Event): void {
      events.push(event);
    }

    static getEvents(): Array<Event> {
      var events_ = events;
      events = [];
      return events_;
    }
  }
}
