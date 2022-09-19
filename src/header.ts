import { BufferReader, Hash } from "./utils";

export default class Header {
  // TODO: Should this be buffer or number
  version?: Buffer;
  prevHash?: any;
  merkleRoot?: any;
  time?: any;
  bits?: any;
  nonce?: any;
  buffer?: any;
  hash?: any;

  static fromBuffer(buf: Buffer) {
    const br = new BufferReader(buf);
    return this.fromBufferReader(br);
  }

  static fromBufferReader(br: BufferReader) {
    const header = new Header();
    const startPos = br.pos;
    header.version = br.readReverse(4);
    header.prevHash = br.readReverse(32);
    header.merkleRoot = br.readReverse(32);
    header.time = br.readUInt32LE();
    header.bits = br.readReverse(4);
    header.nonce = br.readUInt32LE();
    header.buffer = br.slice(startPos, br.pos);
    return header;
  }

  toBuffer() {
    return this.buffer;
  }

  getHash() {
    if (!this.hash) {
      const buf = this.toBuffer();
      this.hash = Hash.sha256sha256(buf).reverse();
    }
    return this.hash;
  }
}
