import * as PIXI from "pixi.js";

export class Scheduler {
    private runningProcesses: Process[];
    private intervals: Array<{ delay: Process, callback: () => void, context?: any }>;

    constructor() {
        this.runningProcesses = [];
        this.intervals = [];
    }

    public run(process: Process, sprite: PIXI.Container): Promise<PIXI.Container> {
        process.setTarget(sprite);
        return new Promise((resolve) => {
            process.setEndCallback(resolve);
            process.run();
        });
    }

    public pause(): void {
        for (let process of this.runningProcesses) {
            process.pause();
        }
        for (let interval of this.intervals) {
            interval.delay.pause();
        }
    }

    public resume(): void {
        for (let process of this.runningProcesses) {
            process.resume();
        }
        for (let interval of this.intervals) {
            interval.delay.resume();
        }
    }

    public stop(): void {
        this.pause();
        this.runningProcesses = [];
    }

    public addRunningProcess(process: Process) {
        for (let currProc of this.runningProcesses) {
            if (currProc.id === process.id) return; // don't add the same process twitce (happens in setInterval when paused/resumed few times)
        }
        this.runningProcesses.push(process);
    }

    public removeRunningProcess(process: Process) {
        for (let i = 0; i < this.runningProcesses.length; i++) {
            if (this.runningProcesses[i].id == process.id) {
                this.runningProcesses.splice(i, 1);
            }
        }
    }

    public forceFinish(process: Process) {
        for (let i = 0; i < this.runningProcesses.length; i++) {
            if (this.runningProcesses[i].id == process.id) {
                this.runningProcesses[i].forceFinish();
                this.runningProcesses.splice(i, 1);
            }
        }
    }

    public setTimeOut(duration: number, callback: () => void, context?: any): Delay {
        const delay = new Delay();
        delay.setTarget(new PIXI.Sprite());
        delay.setEndCallback(callback, context);
        delay.setDuration(duration);
        delay.run();
        return delay;
    }

    public clearTimeOut(delay: Delay) {
        delay.stop();
    }

    public setInterval(duration: number, callback: () => void, context?: any): Process {
        const delay: Process = new Delay().setDuration(duration);

        const process = {
            delay,
            callback,
            context
        };
        this.intervals.push(process);
        delay.setEndCallback(this.nextInterval, this.intervals[this.intervals.length - 1]);
        delay.setTarget(new PIXI.Sprite());
        delay.run();
        return delay;
    }

    private nextInterval() {
        (<any>this).callback.call((<any>this).context);
        if (!(<any>this).delay.isStopped) (<any>this).delay.run();
    }

    public clearInterval(delay: Process): void {
        delay.stop();
        for (let i = 0; i < this.intervals.length; i++) {
            if (this.intervals[i].delay.id == delay.id) {
                this.intervals.splice(i, 1);
            }
        }
    }
}

export var scheduler: Scheduler = new Scheduler();

let animPaused: boolean = false;
//let epsilon: number = 0.001;


export var Types = {
    Process: "process",
    Delay: "delay",
    Sequence: "sequence",
    Parallel: "parallel",
    FadeTo: "fadeTo",
    MoveTo: "moveTo",
    MoveBy: "moveBy",
    RotateTo: "rotateTo",
    RotateBy: "rotateBy",
    ScaleTo: "scaleTo",
    ScaleBy: "scaleBy"
};

export class Process {
    public id: number;
    protected type: string = Types.Process;
    protected duration: number = 1000;
    protected currTime: number = 0;
    protected target: PIXI.Container | undefined;
    protected endCallback: ((target: PIXI.Container) => void) | undefined;
    protected endCallbackContext: any;
    public isStopped: boolean;

    private prevTimestamp: number = 0;

    private currRequestId: number = 0;

    constructor() {
        this.id = Math.random() * 10000;
        this.isStopped = false;
    }

    /**
     * @param {number} duration of animation in milliseconds
     * @returns {bc.Process}
     */
    public setDuration(duration: number): Process {
        this.duration = duration;
        return this;
    }

    public setTarget(target: PIXI.Container): void {
        this.target = target;
    }

    public setEndCallback(callback: (target: PIXI.Container) => void, callbackContext?: any) {
        this.endCallback = callback;
        this.endCallbackContext = callbackContext;
    }

    public run(): void {
        if (!this.target) {
            console.warn("Anim " + this.type + " target not specified");
            return;
        }
        this.isStopped = false;
        this.currTime = 0;
        this.prevTimestamp = performance.now();
        scheduler.addRunningProcess(this);
        if (!animPaused) this.currRequestId = requestAnimationFrame(this.requestAnimCallback);
    };

    protected requestAnimCallback = () => {
        const currTime = performance.now();
        let delta = currTime - this.prevTimestamp;
        if (this.currTime + delta >= this.duration) {
            delta = this.duration - this.currTime;
        } else {
            this.currRequestId = requestAnimationFrame(this.requestAnimCallback);
        }
        this.currTime += delta;
        this.prevTimestamp = currTime;
        this.update(delta);
    }

    public pause() {
        cancelAnimationFrame(this.currRequestId);
    }

    public resume() {
        this.prevTimestamp = performance.now();
        this.currRequestId = requestAnimationFrame(this.requestAnimCallback);
    }

    public stop() {
        this.isStopped = true;
        cancelAnimationFrame(this.currRequestId);
        scheduler.removeRunningProcess(this);
    }

    public forceFinish() {
        cancelAnimationFrame(this.currRequestId);
        this.update(this.duration - this.currTime);
        if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target!);
        scheduler.removeRunningProcess(this);
        this.isStopped = true;
    }

    protected update(delta: number) {
        delta;
    }
}

export class Delay extends Process {
    constructor() {
        super();
        this.type = Types.Delay;
    }

    protected update(delta: number): void {
        delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target!);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class Sequence extends Process {
    private subProcesses: Process[] = [];
    private currentRunningIndex: number = 0;

    constructor(processes: Process[]) {
        super();
        this.type = Types.Sequence;
        this.subProcesses = processes;
    }

    public override run(): void {
        this.currentRunningIndex = 0;
        this.next();
    }

    private increaseCounter = () => {
        this.currentRunningIndex++;
        this.next();
    }

    private next(): void {
        const currProcess = this.subProcesses[this.currentRunningIndex];
        if (currProcess) {
            currProcess.setTarget(this.target!);
            currProcess.setEndCallback(this.increaseCounter);
            currProcess.run();
        } else if (this.endCallback) {
            this.endCallback.call(this.endCallbackContext, this.target!);
        }
    }

    public forceFinish(): void {
        for (const process of this.subProcesses) {
            process.forceFinish();
        }
    }
}

export class Parallel extends Process {
    private subProcesses: Process[] = [];
    private endedProcesses: number = 0;

    constructor(processes: Process[]) {
        super();
        this.type = Types.Parallel;
        this.subProcesses = processes;
    }

    public override run(): void {
        for (let process of this.subProcesses) {
            process.setTarget(this.target!);
            process.setEndCallback(this.checkEnd);
            process.run();
        }
    }

    private checkEnd = () => {
        this.endedProcesses++;
        if (this.endedProcesses === this.subProcesses.length && this.endCallback) {
            this.endCallback.call(this.endCallbackContext, this.target!);
        }
    }
}

export class FadeTo extends Process {
    private to: number;
    private fadeDiffPerMilliSec: number = 0;

    constructor(to: number) {
        super();
        this.type = Types.FadeTo;
        this.to = to;
    }

    public override run(): void {
        super.run();
        this.fadeDiffPerMilliSec = (this.to - this.target!.alpha) / this.duration;
    }

    protected override update(delta: number) {
        this.target!.alpha += delta * this.fadeDiffPerMilliSec;
        if (this.currTime == this.duration) {
            if (this.endCallback)
                this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class MoveTo extends Process {
    private to: PIXI.Point;
    private dir: PIXI.Point | undefined;

    constructor(to: PIXI.Point) {
        super();
        this.to = new PIXI.Point(to.x, to.y);
    }

    public override run(): void {
        super.run();
        this.dir = new PIXI.Point(
            (this.to.x - this.target!.x) / this.duration,
            (this.to.y - this.target!.y) / this.duration
        )
    }

    protected override update(delta: number) {
        this.target!.x += this.dir!.x * delta;
        this.target!.y += this.dir!.y * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class MoveBy extends Process {
    private dir: PIXI.Point | undefined;
    private by: PIXI.Point;

    constructor(by: PIXI.Point) {
        super();
        this.by = new PIXI.Point(by.x, by.y);
    }

    public override run(): void {
        super.run();
        this.dir = new PIXI.Point(this.by.x / this.duration, this.by.y / this.duration);
    }

    protected override update(delta: number) {
        this.target!.x += this.dir!.x * delta;
        this.target!.y += this.dir!.y * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class ScaleTo extends Process {
    private to: PIXI.Point;
    private amount: PIXI.Point;

    constructor(x: number, y?: number) {
        super();
        this.to = new PIXI.Point();
        this.to.set(x, y ? y : x);
        this.amount = new PIXI.Point();
    }

    public override run(): void {
        super.run();
        this.amount.set(
            (this.to.x - this.target!.scale.x) / this.duration,
            (this.to.y - this.target!.scale.y) / this.duration,
        );
    }

    protected override update(delta: number) {
        this.target!.scale.x += this.amount.x * delta;
        this.target!.scale.y += this.amount.y * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class ScaleBy extends Process {
    private amount: PIXI.Point;
    private by: PIXI.Point;

    constructor(by: PIXI.Point) {
        super();
        this.by = new PIXI.Point(by.x, by.y);
        this.amount = new PIXI.Point();
    }

    public override run(): void {
        super.run();
        this.amount.set(this.by.x / this.duration, this.by.y / this.duration);
    }

    protected override update(delta: number) {
        this.target!.scale.x += this.amount.x * delta;
        this.target!.scale.y += this.amount.y * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class RotateTo extends Process {
    private to: number;
    private amount: number = 0;

    constructor(angle: number) {
        super();
        this.to = angle;
    }

    public override run(): void {
        super.run();
        this.amount = (this.to - this.target!.rotation) / this.duration;
    }

    protected override update(delta: number) {
        this.target!.rotation += this.amount * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}

export class RotateBy extends Process {
    private amount: number = 0;
    private by: number;

    constructor(angle: number) {
        super();
        this.by = angle;
    }

    public override run(): void {
        super.run();
        this.amount = this.by / this.duration;
    }

    protected override update(delta: number) {
        this.target!.rotation += this.amount * delta;
        if (this.currTime == this.duration) {
            if (this.endCallback) this.endCallback.call(this.endCallbackContext, this.target);
            scheduler.removeRunningProcess(this);
        }
    }
}
