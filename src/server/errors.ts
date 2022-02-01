export class AppValidationErrorItem {

    readonly message: string;
    readonly path: string;

    constructor(message: string, path: string) {
        this.message = message;
        this.path = path;
    }
}

export class AppValidationError extends Error {

    readonly errors: AppValidationErrorItem[];

    constructor(errors: AppValidationErrorItem[]) {
        super();
        this.name = 'AppValidationError';
        this.message = 'Validation Error';
        this.errors = errors;
    }
}

