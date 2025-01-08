export declare function findManifestJSON(packageType: string): Promise<string>;
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            FOUNDRY_DATA_PATH?: string;
            FOUNDRY_HOST_NAME?: string;
            FOUNDRY_PORT?: string;
            LOCALAPPDATA?: string;
            XDG_DATA_HOME?: string;
        }
    }
}
type HostData = {
    isWSLToWindows: boolean;
    isHostConfigured: boolean;
    host: string;
};
export declare function findFoundryHost(): Promise<HostData>;
export {};
//# sourceMappingURL=utils.d.ts.map