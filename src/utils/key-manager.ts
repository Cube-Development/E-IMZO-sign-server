export class KeyManager {
    private static instance: KeyManager;
    private keyID: string | null = null;

    private constructor() {}

    static getInstance() {
        if (!KeyManager.instance) {
            KeyManager.instance = new KeyManager();
        }
        return KeyManager.instance;
    }

    setKeyID(key: string) {
        this.keyID = key;
    }

    getKeyID() {
        return this.keyID;
    }
}

export const keyManager = KeyManager.getInstance();
