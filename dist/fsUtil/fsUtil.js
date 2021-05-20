"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Module */
class FSUtil {
    static getAcceptedFields(fields, alias) {
        const acceptedFields = [];
        for (const field of Object.keys(fields)) {
            if (typeof fields[field] === 'object' && !Array.isArray(fields[field])) {
                acceptedFields.push(...this.getAcceptedFields(fields[field], (alias ? (alias + '.') : '') + field));
            }
            else {
                acceptedFields.push((alias ? (alias + '.') : '') + field);
            }
        }
        return acceptedFields;
    }
}
exports.default = FSUtil;
