const BN = require('./bn')

const BufferReader = function BufferReader (buf) {
  if (!(this instanceof BufferReader)) {
    return new BufferReader(buf)
  }
  if (!buf) return
  if (Buffer.isBuffer(buf)) {
    this.set({ buf })
  } else if (typeof buf === 'string') {
    const len = buf.length
    buf = Buffer.from(buf, 'hex')
    if (buf.length * 2 !== len) {
      throw new TypeError('Invalid hex string')
    }
    this.set({ buf })
  } else if (typeof buf === 'object') {
    const obj = buf
    this.set(obj)
  } else {
    throw new TypeError(`Unrecognized argument for BufferReader`)
  }
}

BufferReader.prototype.set = function (obj) {
  this.buf = obj.buf || this.buf || undefined
  this.pos = obj.pos || this.pos || 0
  return this
}

BufferReader.prototype.eof = function () {
  return this.pos >= this.buf.length
}

BufferReader.prototype.finished = BufferReader.prototype.eof

BufferReader.prototype.read = function (len) {
  if (typeof len === 'undefined') throw new Error(`Must specify a length`)
  const buf = Buffer.from(this.buf.slice(this.pos, this.pos + len))
  this.pos = this.pos + len
  return buf
}

BufferReader.prototype.readAll = function () {
  const buf = Buffer.from(this.buf.slice(this.pos, this.buf.length))
  this.pos = this.buf.length
  return buf
}

BufferReader.prototype.readUInt8 = function () {
  const val = this.buf.readUInt8(this.pos)
  this.pos = this.pos + 1
  return val
}

BufferReader.prototype.readUInt16BE = function () {
  const val = this.buf.readUInt16BE(this.pos)
  this.pos = this.pos + 2
  return val
}

BufferReader.prototype.readUInt16LE = function () {
  const val = this.buf.readUInt16LE(this.pos)
  this.pos = this.pos + 2
  return val
}

BufferReader.prototype.readUInt32BE = function () {
  const val = this.buf.readUInt32BE(this.pos)
  this.pos = this.pos + 4
  return val
}

BufferReader.prototype.readUInt32LE = function () {
  const val = this.buf.readUInt32LE(this.pos)
  this.pos = this.pos + 4
  return val
}

BufferReader.prototype.readInt32LE = function () {
  const val = this.buf.readInt32LE(this.pos)
  this.pos = this.pos + 4
  return val
}

BufferReader.prototype.readUInt64BEBN = function () {
  const buf = Buffer.from(this.buf.slice(this.pos, this.pos + 8))
  const bn = BN.fromBuffer(buf)
  this.pos = this.pos + 8
  return bn
}

BufferReader.prototype.readUInt64LEBN = function () {
  const second = this.buf.readUInt32LE(this.pos)
  const first = this.buf.readUInt32LE(this.pos + 4)
  const combined = first * 0x100000000 + second
  // Instantiating an instance of BN with a number is faster than with an
  // array or string. However, the maximum safe number for a double precision
  // floating point is 2 ^ 52 - 1 (0x1fffffffffffff), thus we can safely use
  // non-floating point numbers less than this amount (52 bits). And in the case
  // that the number is larger, we can instatiate an instance of BN by passing
  // an array from the buffer (slower) and specifying the endianness.
  let bn
  if (combined <= 0x1fffffffffffff) {
    bn = new BN(combined)
  } else {
    const data = Array.prototype.slice.call(this.buf, this.pos, this.pos + 8)
    bn = new BN(data, 10, 'le')
  }
  this.pos = this.pos + 8
  return bn
}

BufferReader.prototype.readVarintNum = function () {
  const first = this.readUInt8()
  switch (first) {
    case 0xfd:
      return this.readUInt16LE()
    case 0xfe:
      return this.readUInt32LE()
    case 0xff:
      const bn = this.readUInt64LEBN()
      const n = bn.toNumber()
      if (n <= Math.pow(2, 53)) {
        return n
      } else {
        throw new Error(
          'number too large to retain precision - use readVarintBN'
        )
      }
    // break // unreachable
    default:
      return first
  }
}

/**
 * reads a length prepended buffer
 */
BufferReader.prototype.readVarLengthBuffer = function () {
  const len = this.readVarintNum()
  const buf = this.read(len)
  if (buf.length !== len) {
    throw new Error(
      `Invalid length while reading varlength buffer. Expected to read: ${len} and read ${
        buf.length
      }`
    )
  }
  return buf
}

BufferReader.prototype.readVarintBuf = function () {
  const first = this.buf.readUInt8(this.pos)
  switch (first) {
    case 0xfd:
      return this.read(1 + 2)
    case 0xfe:
      return this.read(1 + 4)
    case 0xff:
      return this.read(1 + 8)
    default:
      return this.read(1)
  }
}

BufferReader.prototype.readVarintBN = function () {
  const first = this.readUInt8()
  switch (first) {
    case 0xfd:
      return new BN(this.readUInt16LE())
    case 0xfe:
      return new BN(this.readUInt32LE())
    case 0xff:
      return this.readUInt64LEBN()
    default:
      return new BN(first)
  }
}

BufferReader.prototype.reverse = function () {
  const buf = Buffer.alloc(this.buf.length)
  for (let i = 0; i < buf.length; i++) {
    buf[i] = this.buf[this.buf.length - 1 - i]
  }
  this.buf = buf
  return this
}

BufferReader.prototype.readReverse = function (len) {
  if (!len) {
    len = this.buf.length
  }
  const buf = Buffer.from(this.buf.slice(this.pos, this.pos + len))
  this.pos = this.pos + len
  return buf.reverse()
}

module.exports = BufferReader
