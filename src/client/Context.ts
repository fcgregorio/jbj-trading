import * as React from 'react';
import { User } from './models';

export const AuthContext = React.createContext<[{ user: User, token: string; } | null, ((authContext: { user: User; token: string; } | null) => void)]>([null, function () { }]);