const bsv = require('bsv')
const Transaction = require('./transaction')
const Header = require('./header')
const BlockLite = require('./blocklite')
const {
  encoding: { BufferReader }
} = bsv

function Block () {
  return this
}

/**
 * Instantiate a Block from a Buffer
 *
 * @param {Buffer}
 * @returns {Block}
 * @constructor
 */
Block.fromBuffer = function fromBuffer (buf, opts = { hash: true }) {
  const br = new BufferReader(buf)
  const block = new Block()
  block.header = Header.fromBufferReader(br, opts)
  if (opts && opts.hash) block.getHash()
  block.transactions = []
  block.txCount = br.readVarintNum()
  for (let i = 0; i < block.txCount; i++) {
    const transaction = Transaction.fromBufferReader(br)
    block.transactions.push(transaction)
  }
  block.size = br.pos
  block.buffer = buf
  return block
}

Block.prototype.getHash = function getHash () {
  if (!this.hash) {
    this.hash = this.header.getHash()
  }
  return this.hash
}

Block.prototype.toBuffer = function toBuffer () {
  return this.buffer
}

Block.prototype.toBlockLite = function toBlockLite () {
  return BlockLite.fromBlockBuffer(this.toBuffer())
}

module.exports = Block
