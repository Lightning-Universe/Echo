import { EchoClient } from "generated";
import { getUrl } from "utils";

export const echoClient = new EchoClient({ BASE: getUrl() });
