import Header from "./header";
import Transaction from "./transaction";
import { BufferReader, BufferWriter } from "./utils";

export default class BlockLite {
  header: Header;
  txids: Buffer[];
  txCount: number;
  size: number;
  buffer: Buffer;
  hash?: Buffer;

  private constructor(br: BufferReader, block = false) {
    this.header = Header.fromBufferReader(br);
    this.txids = [];
    this.txCount = br.readVarintNum();
    for (let i = 0; i < this.txCount; i++) {
      if (block) {
        const transaction = Transaction.fromBufferReader(br);
        this.txids.push(transaction.getHash());
      } else {
        const txid = br.read(32);
        this.txids.push(txid);
      }
    }
    this.buffer = br.buf;
    this.size = br.pos;
  }

  static fromBuffer(buf: Buffer) {
    const br = new BufferReader(buf);
    return new BlockLite(br);
  }

  static fromBlockBuffer(buf: Buffer) {
    const br = new BufferReader(buf);
    return new BlockLite(br, true);
  }

  getHash() {
    this.hash = this.header.getHash();
    return this.hash;
  }

  toBuffer() {
    if (!this.buffer) {
      const bw = new BufferWriter();
      bw.write(this.header.toBuffer());
      this.txCount && bw.writeVarintNum(this.txCount);

      if (this.txids) {
        for (const txid of this.txids) {
          bw.write(txid);
        }
      }
      this.buffer = bw.toBuffer();
      this.size = this.buffer.length;
    }
    return this.buffer;
  }
}
