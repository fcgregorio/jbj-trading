interface UserAttributes {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface User extends UserAttributes { };