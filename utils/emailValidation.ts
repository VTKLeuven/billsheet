import { allowedEmailDomains } from './constants';

export const isEmailAllowed = (email: string): boolean => {
    return allowedEmailDomains.some(domain => email.endsWith(domain));
};

export const getAllowedDomainsText = (): string => {
    if (allowedEmailDomains.length === 1) {
        return `Alleen ${allowedEmailDomains[0]} email adressen zijn toegestaan`;
    }
    return `Alleen ${allowedEmailDomains.join(", ")} email adressen zijn toegestaan`;
};
