/* Module */
class FSUtil {
    protected static getAcceptedFields(fields: any, alias?: string): string[] {
        const acceptedFields: string[] = [];

        for (const field of Object.keys(fields)) {
            if (typeof fields[field] === 'object' && !Array.isArray(fields[field])) {
                acceptedFields.push(...this.getAcceptedFields(fields[field],
                    (alias ? (alias + '.') : '') + field));
            }
            else {
                acceptedFields.push((alias ? (alias + '.') : '') + field);
            }
        }

        return acceptedFields;
    }
}

export default FSUtil;
