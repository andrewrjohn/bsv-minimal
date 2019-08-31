const Header = require('./header')
const Transaction = require('./transaction')
const { BufferReader, BufferWriter } = require('./utils')

function BlockLite () {
  return this
}

/**
 * Instantiate a BlockLite from a Buffer
 *
 * @param {Buffer}
 * @returns {BlockLite}
 * @constructor
 */
BlockLite.fromBuffer = function fromBuffer (buf) {
  const br = new BufferReader(buf)
  const block = new BlockLite()
  block.header = Header.fromBufferReader(br)
  block.txids = []
  block.txCount = br.readVarintNum()
  for (let i = 0; i < block.txCount; i++) {
    const txid = br.read(32)
    block.txids.push(txid)
  }
  block.size = br.pos
  block.buffer = buf
  return block
}

BlockLite.fromBlockBuffer = function fromBlockBuffer (buf) {
  const br = new BufferReader(buf)
  const block = new BlockLite()
  block.header = Header.fromBufferReader(br)
  block.txids = []
  block.txCount = br.readVarintNum()
  for (let i = 0; i < block.txCount; i++) {
    const transaction = Transaction.fromBufferReader(br)
    block.txids.push(transaction.getHash())
  }
  return block
}

BlockLite.prototype.getHash = function getHash () {
  if (!this.hash) {
    this.hash = this.header.getHash()
  }
  return this.hash
}

BlockLite.prototype.toBuffer = function toBuffer () {
  if (!this.buffer) {
    const bw = new BufferWriter()
    bw.write(this.header.toBuffer())
    bw.writeVarintNum(this.txCount)
    for (const txid of this.txids) {
      bw.write(txid)
    }
    this.buffer = bw.toBuffer()
    this.size = this.buffer.length
  }
  return this.buffer
}

module.exports = BlockLite
