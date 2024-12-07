(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":1,"ieee754":6,"isarray":3}],3:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],4:[function(require,module,exports){

/// Serialize the a name value pair into a cookie string suitable for
/// http headers. An optional options object specified cookie parameters
///
/// serialize('foo', 'bar', { httpOnly: true })
///   => "foo=bar; httpOnly"
///
/// @param {String} name
/// @param {String} val
/// @param {Object} options
/// @return {String}
var serialize = function(name, val, opt){
    opt = opt || {};
    var enc = opt.encode || encode;
    var pairs = [name + '=' + enc(val)];

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
};

var regexTrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
var trim = function (str){
    if(str.trim){
        return str.trim();
    }
    return str.replace(regexTrim, "");
}

/// Parse the given cookie header string into an object
/// The object has the various cookies as keys(names) => values
/// @param {String} str
/// @return {Object}
var parse = function(str, opt) {
    opt = opt || {};
    var obj = {}
    var pairs = str.split(/[;,] */);
    var dec = opt.decode || decode;

    var len = pairs.length;
    for(var i = 0; i < len ; i++){
        var pair = pairs[i];
        var eq_idx = pair.indexOf('=')

        // skip things that don't look like key=value
        if (eq_idx < 0) {
            continue;
        }

        var key = trim(pair.substr(0, eq_idx));
        var val = trim(pair.substr(++eq_idx, pair.length));

        // quoted values
        if ('"' == val[0]) {
            val = val.slice(1, -1);
        }

        // only assign once
        if (undefined == obj[key]) {
            try {
                obj[key] = dec(val);
            } catch (e) {
                obj[key] = val;
            }
        }
    };

    return obj;
};

var encode = encodeURIComponent;
var decode = decodeURIComponent;

module.exports.serialize = serialize;
module.exports.parse = parse;

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],8:[function(require,module,exports){
module.exports = require("./jquery.build.js");
},{"./jquery.build.js":9}],9:[function(require,module,exports){
/**
 * The JQuery.node plugin. A DOM builder in the spirit of the Scriptaculous
 * Builder.Node.
 * 
 * Copyright (c) 2011 Ian Taylor
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (){
    var ctor = function ($, document){
      /** Capability detection **/
      
      // IE Pre 9 has a weird bug with buttons and input tags that
      // causes it to throw exceptions when trying to set type
      // After the element has been created.
      var hasNormalInputButtonCreate = true;
      try{
        var btn = document.createElement("button");
        btn.type = "button";
      }
      catch (e){
        hasNormalInputButtonCreate = false;
      }
      //IE < 9 can't create stylesheets like normal elements, it has to use 
      //a funky cssText property on its proprietary styleSheet object.
      var tempStyle = document.createElement("style");
      tempStyle.type = "text/css";
      var funkyStylesheetCreate = tempStyle.styleSheet && ('cssText' in tempStyle.styleSheet);

      
      //Many versions of IE will eat spaces off the front and back of text nodes
      var spaceTestElem = document.createElement("div");
      spaceTestElem.innerHTML = " s ";
      var spaceTestValue = spaceTestElem.childNodes[0].nodeValue;
      var requiresLeadingSpace = spaceTestValue.indexOf(" ") != 0;
      var requiresTrailingSpace = spaceTestValue.lastIndexOf(" ") != 2; 
      /** End Capability detection  */

      /** Support functions */

      //Regex Caching
      var regexApos = /&apos;/g;
      var regexLt = /</g;
      var regexGt = />/g;
      // These selector expressions were ripped from the Sizzle code.
      var elemExpr = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/;
      var idExpr = /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/;
      var classExpr = /\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/g;
      var attrExpr = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/g;
      var attrPart = /[\[\]]/g;


      /**
       * Creates a shallow clone of an array.
       */
      var arrayClone = function (arr){
        var a = [];
        $.each(arr, function (i, o){a.push(o);});
        return a;
      };
      
      var addHtmlTextToFrag = function (f, text){
       
      };
      var addPlainTextToFrag = function (f, text){
        if(requiresLeadingSpace && text.charAt(0) === " "){
          f.appendChild(document.createTextNode(" "));
        }
        f.appendChild(document.createTextNode(text));
        if(requiresTrailingSpace && text.charAt(text.length -1) === " "){
          f.appendChild(document.createTextNode(" "));
        }
      };
      
      
      var addFx =  function (f, item){
        if(!item){
          return;
        }
        if (item.jquery){
          f.appendChild(item.get(0));
        }
        else if (item.nodeType == 1 || item.nodeType == 3 || item.nodeType == 11){ 
          /* Element, Text, and DocumentFragment nodes get appended */
          f.appendChild(item);
        }
        else if ($.isArray(item)){
          var i = 0;
          var l = item.length;
          for(i = 0; i < l; i++){
             addFx(f, item[i]);
          }
        }
        else{
          addPlainTextToFrag(f, item.toString());
        }
      };
      /**
       * @function Allows you to create a new DocumentFragment node by passing in
       *           jQuery objects, Dom Nodes, or text strings, either inside of an
       *           array or as a single item.
       * 
       * See: http://ejohn.org/blog/dom-documentfragments/ for more on why to use
       * documentfragments.
       */
      var docFrag = function (children){
        var f = document.createDocumentFragment();
        if (children){
          if ($.isArray(children)) {
            var i =0;
            var l = children.length;
            for(i = 0; i < l; i++){
              addFx(f, children[i]);
            }
          }
          else {
            addFx(f,children);
          }
        }
        return f;
      };
      
      /**
       * @function This function converts a HTML string to a DocumentFragment.
       * It uses Element.innerHTML to do the parsing, so it's as fast as possible.
       * 
       * Basically, if you want HTML to pass through $.build without it being HTMLEncoded,
       * you must wrap the text with a call to this function.
       * 
       * 
       * @example: 
       *  $.build("div", [ 
       *    $.build.html("This is a <em>HTML</em> string!"),
       *    "This is a <em>Plain Text</em> string!
       *   ]);
       *  result:
       *  <div>
       *    This is a <em>HTML</em> string!
       *    This is a &lt;em&gt;Plain Text&lt;/em&gt; string!
       *  </div>
       */
      var html = function (text){
        var f = document.createDocumentFragment();
        if(text){
          //Browsers/DOM impls supporting DocumentFragment.innerHTML get a fast track. 
          if(typeof f.innerHTML != "undefined"){
            f.innerHTML = text;
          }else{
            var tempElem = document.createElement("div");
            tempElem.innerHTML = text.replace(regexApos, "'");
            if(requiresLeadingSpace && text.indexOf(" ") == 0){
              f.appendChild(document.createTextNode(" "));
            }
            while(tempElem.hasChildNodes()){
              //appending to a new parent removes the item from the old parent, 
              //thus this operation is safe and fast.
              f.appendChild(tempElem.firstChild);
            }
            if(requiresTrailingSpace && text.lastIndexOf(" ") == (text.length -1)){
              f.appendChild(document.createTextNode(" "));
            }
          }
        }
        return f;
      };

      /* End support functions */

      $.build = function (selector, attributes, children){
        if(arguments.length == 2 && attributes!=null &&
            (typeof attributes == "string" || $.isArray(attributes) || attributes.nodeType || attributes.jquery)){
          children = attributes;
          attributes = null;
        }
        selector = selector || "";

        var elemTag;
        elemTag = selector.match(elemExpr);
        if(elemTag){
          elemTag = elemTag[0];
        }
        var id = null;
        if(selector.indexOf("#") != -1){
          var id = selector.match(idExpr);
          if (id){
              id = id[1];
          }
          else{
            id = null;
          } 
        }
        var className;
        if(selector.indexOf(".") != -1){
          className = selector.match(classExpr);
        }
        var attrs;
        if(selector.indexOf("[") != -1){
          attrs = selector.match(attrExpr);
        }
        elemTag = elemTag || "div";
        if (attrs){
          attributes = attributes || {};
          $.each(attrs, function (i, attr){
            var parts = attr.replace(attrPart, "").split("=");
            if (parts && parts.length ==2){
              attributes[parts[0]] = parts[1];
            }
          });
        }
        attributes = attributes || {};
        var elem;
        if(!hasNormalInputButtonCreate && (elemTag === "input" || elemTag ==="button")){
          // In IE versions before IE 9, an input or button type can only be set
          // once, at creation. If you try to set it
          // after the fact, you get exceptions
          var type = attributes.type ? "type=\""+attributes.type+"\"" : ""; 
          // Name has to be set at creation time for radio buttons only, but
          // doesn't hurt for any other input/buttons.
          var name = attributes.name ? "name=\""+attributes.name+"\"" : "";
          elem = document.createElement("<"+elemTag+" " +type+" " +name+">");

          delete attributes["type"];
          delete attributes["name"];
        }
        else{
          elem = document.createElement(elemTag);
        }

        var jqElem = $(elem);
        
        // Set the attributes using jQuery.
        if(attributes){
          jqElem.attr(attributes);
        }
        if(id){
          elem.id = id;
        }
        
        
        if(elemTag === "img"){
          // IE 8 bug with image elements in IE 8 standards mode.
          // IE 8 will automatically add in width and height attributes to 'help'
          // you if it has the image already in its cache.
          // in doing so, it craps up it's own rendering if there is a max-height
          // or max-width style applied.
          // we will remove any unrequested height and width attributes here.
          if(!attributes.width){
            jqElem.removeAttr("width");
          }
          if(!attributes.height){
            jqElem.removeAttr("height");
          }       
        }
        if (className){
          var cls ="";
          $.each(className, function (i, str) { cls+= str.replace(".", "") + " ";});
          elem.className = $.trim(elem.className + " " + cls);
        }    

        if(funkyStylesheetCreate && elemTag == "style" && typeof children === "string"){
          //IE < 9 has a weird implementation of stylesheets, 
          //You can't just append a normal text node of styles to a style element,
          //You have to first give the stylesheet a type of "text/css", then add the string
          //as the cssText property.
          if(!jqElem.attr("type")){
            jqElem.attr("type", "text/css");
          }
          elem.styleSheet.cssText = children;
        }else if (children){
          if(children.nodeType == 11)
            // Already a document fragment.
            elem.appendChild(children);
          else
            elem.appendChild(docFrag(children));
        }
        return jqElem;
      };
      
      //expose docFrag and html children of $.build 
      $.build.docFrag = docFrag;
      $.build.html = html;
      return $.build;
    };
    
    if(typeof module !== "undefined" && module.exports){
      module.exports = ctor;
    }
    if(typeof window !== "undefined" && window.jQuery && window.document) {
      ctor(window.jQuery, window.document);
    }
}
)();


},{}],10:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],13:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":11,"./encode":12}],14:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":2}],15:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer

// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = Buffer.alloc(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = Buffer.from(data, enc)
  }

  var block = this._block
  var blockSize = this._blockSize
  var length = data.length
  var accum = this._len

  for (var offset = 0; offset < length;) {
    var assigned = accum % blockSize
    var remainder = Math.min(length - offset, blockSize - assigned)

    for (var i = 0; i < remainder; i++) {
      block[assigned + i] = data[offset + i]
    }

    accum += remainder
    offset += remainder

    if ((accum % blockSize) === 0) {
      this._update(block)
    }
  }

  this._len += length
  return this
}

Hash.prototype.digest = function (enc) {
  var rem = this._len % this._blockSize

  this._block[rem] = 0x80

  // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
  // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
  this._block.fill(0, rem + 1)

  if (rem >= this._finalSize) {
    this._update(this._block)
    this._block.fill(0)
  }

  var bits = this._len * 8

  // uint32
  if (bits <= 0xffffffff) {
    this._block.writeUInt32BE(bits, this._blockSize - 4)

  // uint64
  } else {
    var lowBits = (bits & 0xffffffff) >>> 0
    var highBits = (bits - lowBits) / 0x100000000

    this._block.writeUInt32BE(highBits, this._blockSize - 8)
    this._block.writeUInt32BE(lowBits, this._blockSize - 4)
  }

  this._update(this._block)
  var hash = this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash

},{"safe-buffer":14}],16:[function(require,module,exports){
var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = require('./sha')
exports.sha1 = require('./sha1')
exports.sha224 = require('./sha224')
exports.sha256 = require('./sha256')
exports.sha384 = require('./sha384')
exports.sha512 = require('./sha512')

},{"./sha":17,"./sha1":18,"./sha224":19,"./sha256":20,"./sha384":21,"./sha512":22}],17:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha

},{"./hash":15,"inherits":7,"safe-buffer":14}],18:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1

},{"./hash":15,"inherits":7,"safe-buffer":14}],19:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Sha256 = require('./sha256')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = Buffer.allocUnsafe(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224

},{"./hash":15,"./sha256":20,"inherits":7,"safe-buffer":14}],20:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = Buffer.allocUnsafe(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256

},{"./hash":15,"inherits":7,"safe-buffer":14}],21:[function(require,module,exports){
var inherits = require('inherits')
var SHA512 = require('./sha512')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = Buffer.allocUnsafe(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384

},{"./hash":15,"./sha512":22,"inherits":7,"safe-buffer":14}],22:[function(require,module,exports){
var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = Buffer.allocUnsafe(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512

},{"./hash":15,"inherits":7,"safe-buffer":14}],23:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":10,"querystring":13}],24:[function(require,module,exports){
var $ = require("./jquery.js");
var comparators = require("./comparators.js");
var fh = require("./fields/fieldhelpers.js");
//Deals with visiblity rules, dependency management

module.exports = {
  getChangeMap:getChangeMap,  
  fieldChangeChecker:fieldChangeChecker,
  applyPicklistAlterations:applyPicklistAlterations
}

function getChangeMap(fields, formDescriptor){
  var changeMap ={};
  $.each(fields, function(i, field){
    if(field.Datatype == "hidden" || field.Datatype == "profiling"){
      //Don't evaluate visibility rules on hidden or profiling fields.
      return;
    }
    var vr = field.VisibilityRule;
    if(vr){
      //Every field in a fieldset is dependent on the fieldset.
      if(field.Datatype == "fieldset"){
        if(Object.keys(formDescriptor.fieldsetRows).length > 0) {
          var childFields = fh.flatten(formDescriptor.fieldsetRows[""+field.Id]);
          var deps = changeMap[field.Name];
          if(!deps){
            deps = [];
          }
          deps = deps.concat($.map(childFields, function (f){return f.Name;}));
          changeMap[field.Name] = deps;
        }
      }
      //New format has more than one rule.
      var rules = vr.rules || [vr];
      $.each(rules, function (i, rule){
        if(typeof rule === "string"){
          return;
        }
        var dependents = changeMap[rule.subjectField];
        if(!dependents){
          dependents = [];
        }
        if($.inArray(field.Name, dependents) === -1){
          dependents.push(field.Name);
        }
        changeMap[rule.subjectField] = dependents;
      });
    }
  });
  return changeMap;
}

function firstItem (arr, test){
  var len = arr.length;
  for(var i =0; i < len; i++){
    var item = arr[i];
    if(test(item)){
      return item;
    }
  }
  return undefined;
}

function applyPicklistAlterations (field, rule){
  if(rule && (field.PicklistValues || rule.picklistKeys || rule.altLabel)){
    //make a deep copy of the field
    field = $.extend(true, {}, field);

    if (field.PicklistValues){
      if (rule.picklistFilterValues){
        // The filter is a list of label/value objects, need to compare both fields
        
        // Build map from values to list of labels to avoid nested loop search
        var filterKeysToValues = {};
        $.each(rule.picklistFilterValues, function (i, val){
          if (!filterKeysToValues.hasOwnProperty(val.value)){
            filterKeysToValues[val.value] = [];
          }
          filterKeysToValues[val.value].push(val.label);
        });
        
        field.PicklistValues = $.map(field.PicklistValues, function (val){
          if (filterKeysToValues.hasOwnProperty(val.value) && $.inArray(val.label, filterKeysToValues[val.value]) != -1){
            return val;
          }
        });
      }
      else if (rule.picklistKeys){
        // Pre-February2014, the picklistKeys property was used to filter
        // the values for the picklist, was replaced by picklistFilterValues to avoid problems
        // with to values having the same keys (see above)
        
        //Filter the picklist values by the keys
        field.PicklistValues = $.map(field.PicklistValues, function (val){
          if($.inArray(val.value, rule.picklistKeys) != -1){
            return val;
          } 
        });
      }
    }
    
    //Set the new label
    if(rule.altLabel){
      field.InputLabel = rule.altLabel;
    }
  }
  return field;
}

function fieldChangeChecker (vr, vals){
  if(!vr){
    return {show:true};
  }
  var show = vr.defaultVisibility == "show";
  
  var rules = vr.rules || [vr];
  
  var results = $.map(rules, function (rule){
    if(typeof rule === "string"){
      return;
    }
    var val = vals[rule.subjectField];
    if(!$.isArray(val)){
      val = val ? [val] : []
    }
    var comparator = comparators[rule.operator];
    var ok = comparator(val, rule.values);

    if(ok){
      return rule;
    }
    return null;
  });

  var activeRule = firstItem(results, function (item){
    return item !== null;
  })
  if(show){
    //If something is default "show"
    //Then it is shown when ALL of the value tests provided fail 
    return {show:!activeRule, rule:activeRule};
  }else{
    //If something is default "hide", then it is shown when ANY of the 
    //tests pass
    return {show:!!activeRule, rule:activeRule};
  }
}

},{"./comparators.js":26,"./fields/fieldhelpers.js":30,"./jquery.js":45}],25:[function(require,module,exports){


module.exports = {
  parseColor:parseColor,
  compareColor:compareColor
}
/**
  Parses a color string into an array [r,g,b,a];
  supports the following formats:
  #fff
  #ffffff
  rgba(255,255,255,0)
  rgb(255,255,255)
  returns null if the string wasn't a valid color.
*/
function parseColor (color){
  var match;
  var p = parseInt;
  color = (color || '').replace(/\s\s*/g,'');
  /* jshint -W084 */
  // #000000 format
  if (match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(color)){
    return [p(match[1], 16), p(match[2], 16), p(match[3], 16), 1];
  }
  // #000 format
  else if (match = /^#([\da-f])([\da-f])([\da-f])/i.exec(color)){
    return [p(match[1], 16) * 17, p(match[2], 16) * 17, p(match[3], 16) * 17, 1];
  }
  //rgba(0,0,0,0) format
  else if (match = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/i.exec(color)){
    return [+match[1], +match[2], +match[3], +match[4]];
  }
  // rgb(0,0,0) format
  else if (match = /^rgb\(([\d]+),([\d]+),([\d]+)\)/i.exec(color)){
    return [+match[1], +match[2], +match[3], 1];
  }
  /* jshint +W084 */
  return null;
}

/**
  Compares two colors strings by value
  returns true if they're both valid colors and match, false otherwise.
*/
function compareColor (color1, color2){
  var c1 = parseColor(color1);
  var c2 = parseColor(color2);
  if(!c1 || !c2){
    return false;
  }
  for(var i = 0; i < 4; i++){
    if(c1[i] !== c2[i]){
      return false;
    }
  }
  return true;
}
},{}],26:[function(require,module,exports){
var intersect = function (x, y, fn){
  var ret = [];
  for (var i = 0; i < x.length; i++) {
      for (var z = 0; z < y.length; z++) {
          if (fn(x[i],y[z])) {
              ret.push(x[i]);
              break;
          }
      }
  }
  return ret;            
}


var comparators = {
  //tests if any elements from array are equal to any elements in array b
  equal: function (a, b){
    var fn = function(x,y){
      return x === y; 
    };
    return intersect(a, b, fn).length > 0;
  },
  //returns true if all values in array a are not in array b
  notEqual: function (a, b){
    var fn = function(x,y){
      return x === y; 
    };
    return intersect(a, b, fn).length === 0;
  },
  //returns true if there is no value  
  empty: function(a,b){
    return a.length === 0;
  },
  //returns true if there is a value
  notEmpty: function(a,b){
    return a.length > 0;
  },
  //returns true if there is a value
  any: function(a,b){
    return a.length > 0;
  },
  //returns true if any value begins with any supplied value
  startsWith: function(a,b){
    var fn = function(x,y){
      return x.indexOf(y) === 0; 
    };
    return intersect(a, b, fn).length > 0;
  },
  //returns true if no value begins with any supplied value
  notStartsWith: function(a,b){
    var fn = function(x,y){
      return x.indexOf(y) === 0; 
    };
    return intersect(a, b, fn).length === 0;
  },
   //returns true if any value begins with any supplied value
  endsWith: function(a,b){
    var fn = function(x,y){
      return x.slice(-y.length) === y;
    };
    return intersect(a, b, fn).length > 0;
  },
  //returns true if no value begins with any supplied value
  notEndsWith: function(a,b){
    var fn = function(x,y){
      return x.slice(-y.length) === y;
    };
    return intersect(a, b, fn).length === 0;
  },
  //returns true if any value contains any supplied value
  contains: function(a,b){
    var fn = function(x,y){
      return x.match(new RegExp(y, 'g')); 
    };
    return intersect(a, b, fn).length > 0;
  },
  //returns true if no value contains any supplied value
  notContains: function(a,b){
    var fn = function(x,y){
      return x.match(new RegExp(y, 'g')); 
    };
    return intersect(a, b, fn).length === 0;
  },
  //returns true if value is greater or equal to supplied value
  atLeast: function(a,b){
    return a[0] >= b[0];
  },
  //returns true if value is less than or equal to supplied value
  atMost: function(a,b){
    return a[0] <= b[0];
  },
  //returns true if number is greater than supplied value
  greaterThan: function(a,b){
    return a[0] > b[0];
  },
  //returns true if number is less than supplied value
  lessThan: function(a,b){
    return a[0] < b[0];
  },
  //returns true if number is between two given values
  between: function(a,b){
    return a[0] > b[0] && a[0] < b[1];
  },
  //returns true if number is not between two given values
  notBetween: function(a,b){
    return a[0] < b[0] || a[0] > b[1];
  },
  //returns true if value is between two supplied dates
  inTimeFrame: function(formVals,compVals){
    return (new Date(formVals[0])) > (new Date(compVals[0])) && (new Date(formVals[0])) < (new Date(compVals[1]));
  },
  //returns true if value is not between two supplied dates
  notInTimeFrame: function(formVals,compVals){
    return (new Date(formVals[0]) < new Date(compVals[0]) || new Date(formVals[0]) > new Date(compVals[1]));
  },
  //returns true if value is before now
  inPast: function(formVals,compVals){
    return (new Date(formVals[0])) < (new Date());
  },
  //returns true if value is now or in the future
  notInPast: function(formVals,compVals){
    return (new Date(formVals[0])) >= (new Date());
  },
  //returns true if value is before given date
  before: function(formVals,compVals){
    return (new Date(formVals[0])) < (new Date(compVals[0]));
  },
  //returns true if value is after given date
  after: function(formVals,compVals){
    return (new Date(formVals[0])) > (new Date(compVals[0]));
  },
  //returns true if value is equal to or before the given date 
  onOrBefore: function (formVals, compVals){
    return (new Date(formVals[0])) <= (new Date(compVals[0]));
  },
  //returns true if value is equal to or after the given date 
  onOrAfter: function(formVals,compVals){
    return (new Date(formVals[0])) >= (new Date(compVals[0]));
  }
};
module.exports = comparators;

},{}],27:[function(require,module,exports){
var cookie = require("cookie");

/*
*  Unsets a cookie on all sub domains.
*  @param cookieName the name of the cookie to remove
*  @param hostname the name of the host to remove cookies from, or location.hostname if unset
*  @returns an array of all the domains that were unset.
*/

function removeCookieAllDomains (cookieName, hostname){
  hostname = hostname || location.hostname;
  var d = new Date(); 
  d.setFullYear(d.getFullYear() -1);
  //Unset on current domain.
  var removedDomains = [];
  document.cookie = cookie.serialize(cookieName, "", {expires:d, path:"/"});
  removedDomains.push("");
  //Unset on each sub domain...
  //So if the current domain is www.foo.bar.baz.com
  //We'd unset .www.foo.bar.baz.com, then .foo.bar.baz.com, then .bar.baz.com, then .baz.com;
  var hostParts = hostname.split(".");
  while(hostParts.length > 1 ){
    var domain = "." + hostParts.join(".");
    document.cookie = cookie.serialize(cookieName, "", {expires:d, path:"/", domain:domain});
    removedDomains.push(domain);
    hostParts.shift();
  }
  return removedDomains;
}
module.exports.removeCookieAllDomains = removeCookieAllDomains;
},{"cookie":4}],28:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var currency = {};
module.exports = currency;
currency.fieldType = "currency";

var currencyPattern = /[0-9]+/g;

var validateCurrency = function (v){
  if(!v){
    return true;
  }
  return v.match(currencyPattern);
}
  
currency.newField = function (field, formData){
  var e = fh.renderInput("text", field, formData);
  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:$.proxy(e.val, e),
    required:field.IsRequired,
    validator:validateCurrency,
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}

},{"../jquery.js":45,"./fieldHelpers.js":29}],29:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;



var fieldHelpers = {};

fieldHelpers.splitSemis = function (str){
  str = "" + str;
  return str.split(/\s?;\s?/);
};

fieldHelpers.cap = function (s){
  return s.charAt(0).toUpperCase() + s.slice(1);
};

fieldHelpers.first = function (){
  for (var i = 0; i < arguments.length; i++){
    var v = arguments[i];
    if(v !== null && v!== undefined){
      return v;
    }
  }
  return null;
};

fieldHelpers.getLabelId = function (name, id){
  if(id !== undefined && name != id) {
    return "Lbl" + name + " " + "Lbl" + id;
  }
  return "Lbl" + name;
}

fieldHelpers.getInstructionId = function (name) {
  if(name !== undefined) {
    return "Instruct" + name;
  }
}

fieldHelpers.getValidationMsgId = function (name) {
  if(name !== undefined) {
    return "ValidMsg" + name;
  }
}

fieldHelpers.formatStandardField = function(fieldElem, field, formData){
  var first = fieldHelpers.first;
  var fieldWrap;
  var elems = $b.docFrag([
    $b(".mktoOffset").css({width:first(field.OffsetWidth, formData.OffsetWidth, 0)}),
    fieldWrap = $b(".mktoFieldWrap",[
        $b("label.mktoLabel.mktoHasWidth", {"for":field.Name, "id":fieldHelpers.getLabelId(field.Name)}, [
          $b(".mktoAsterix", "*"),
          $b.html(field.InputLabel)
        ]).css({
          width: first(field.LabelWidth, formData.LabelWidth, 0)
        }),
        $b(".mktoGutter.mktoHasWidth").css({width:first(field.GutterWidth,formData.GutterWidth,0)}),
        fieldElem.addClass("mktoHasWidth").css({width:first(field.FieldWidth, formData.FieldWidth, 0 )}),
        $b("span.mktoInstruction", {"id":fieldHelpers.getInstructionId(field.Name), "tabindex":"-1"},
            field.Description),
        $b(".mktoClear")
      ]
    ),
    $b(".mktoClear")
  ]);
  if(field.IsRequired){
    fieldWrap.addClass("mktoRequiredField");
  }
  return elems;
}
fieldHelpers.renderInput = function (type, field, formData){
  var e = $b("input[type="+type+"].mktoField.mkto"+fieldHelpers.cap(type)+"Field", {
    id:field.Name,
    name:field.Name,
    placeholder:field.PlaceholderText,
    maxlength:field.Maxlength || 2000,
    title:field.Description,
    "aria-labelledby":[fieldHelpers.getLabelId(field.Name), fieldHelpers.getInstructionId(field.Name)].join(" ")
  })
  return e;
}
fieldHelpers.isSet = function (v){
  return v !== null && v !== undefined; 
}
fieldHelpers.flatten = function (arr, accum){
  accum = accum || [];
  $.each(arr, function (i, v){
    if($.isArray(v)){
      fieldHelpers.flatten(v, accum);
    }else{
      accum.push(v);
    }
  });
  return accum;
}
fieldHelpers.vals = function (obj){
  return $.map(obj, function (val){return val;});
}

fieldHelpers.getFlattenedFields = function (formData){
  var fields = [];
  
  fields = fieldHelpers.flatten(formData.rows);

  if(formData.fieldsetRows){
    fields = fields.concat(fieldHelpers.flatten(fieldHelpers.vals(formData.fieldsetRows)));
  }
  return fields;
};
/** 
* returns an object with a key with value = true for each Datatype in a list of fields 
* eg: {textarea:true, range:true, date:true} 
* see: getFlatenenedFields() for how to get a list of fields to pass to this.
*/
fieldHelpers.getFieldTypes = function (fields){
  var fieldTypes = {};
  for(var i = 0; i < fields.length; i++){ 
    fieldTypes[fields[i].Datatype] = true;
  }
  return fieldTypes;
};
/** 
* returns true if any field in fields list has a set property named propertyName 
* see: getFlatenenedFields() for how to get a list of fields to pass to this.
*/
fieldHelpers.anyFieldHasProperty = function (fields, propertyName){
  for(var i =0; i < fields.length ; i++){
    if(fields[i][propertyName]){
      return true;
    }
  }
  return false;
};

fieldHelpers.getFieldsByName = function(fields){
  var fieldsByName = {};
  $.each(fields, function (i, v){
    fieldsByName[v.Name] = v;
  });
  return fieldsByName;
};


module.exports = fieldHelpers;
},{"../jquery.js":45}],30:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"../jquery.js":45,"dup":29}],31:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var checkbox = {};
module.exports = checkbox;
checkbox.fieldType = "checkbox";

var singletonValuePairs = {
  "true":"false",
  "1":"0",
  "Yes":"No",
  "yes":"no"
}
var makeValFn = function (e, singletonValue){

  return function(val){
    var inputs = e.find("input");
    if(arguments.length === 0){
      if(singletonValue){
        //special case for singleton checkbox being used as a true/false.
        //These support the forms v1 syntaxes.  1/0 true/false, yes/no
        if(inputs.is(":checked")){
          return singletonValue;
        }else{
          return singletonValuePairs[singletonValue];
        }
      }
      inputs = e.find("input:checked");

      var vals = [];
      inputs.each(function (){
        vals.push($(this).val());
      })
      if(!vals.length){
        return undefined;
      }
      if(vals.length == 1){
        return vals[0]
      }
      return vals;
    }else{
      if(singletonValue && typeof val === "boolean"){
        //On a singleton, we accept booleans true/false always.
        e.find("input").prop("checked", val);
        return;
      }
      if(singletonValue && val === null){
        //Null on a checkbox is a no-op.
        return;
      }
      if(val && !$.isArray(val)){
        val = "" + val;
        val = fh.splitSemis("" + val);  
      }
      e.find("input").prop("checked", false);
      if(val){
        $.each(val, function (i, v){
          e.find("input[value='"+v+"']").prop("checked", true);
        })
      }      
    }
  }
}
checkbox.newField = function (field, formData){
  var plVals = field.PicklistValues || [];

  var e = $b(".mktoLogicalField.mktoCheckboxList", {title:field.Description}, [
    $.map(plVals, function (val, i){
      var id = "mktoCheckbox_" + (field.Id || field.Name) + "_" +i;
      var labelText = val.label || val.name;

      //for single value checkboxes, they can use the field name as the id.
      //if there is more than one checkbox, we use instead a unique identifier.
      if(plVals.length == 1 && !labelText){
         id = field.Name;
      }
  
      return $b.docFrag([
        $b("input.mktoField", {
            name:field.Name,
            id:id,
            type:"checkbox",
            value:val.value,
            "aria-required":field.IsRequired,
            "aria-labelledby":[fh.getLabelId(field.Name, id), fh.getInstructionId(field.Name)].join(" ")
        }),
        $b("label", {"for": id, "id": fh.getLabelId(id)}, [
          $b.html(labelText)
        ])
      ]);
    })
  ]);
  if(field.IsLabelToLeft){
    e.addClass("mktoLabelToLeft");
  }
  var singletonValue = "";
  if(plVals.length === 1){
    if($.inArray(plVals[0].value, Object.keys(singletonValuePairs)) !== -1){
      singletonValue = plVals[0].value;
    }
  }
  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:makeValFn(e, singletonValue),
    required:field.IsRequired,
    requiredValFn:function (v){
      v = $.trim(v);
      if(v && singletonValue){
        return v !== singletonValuePairs[singletonValue];
      }
      return !!v;
    },
    validatorElem:e,
    validatorFocusElem:e.find("input:eq(0)"),
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}
},{"../jquery.js":45,"./fieldHelpers.js":29}],32:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var date = {};
module.exports = date;
date.fieldType = "date";

var checkDate = function (e){
  var elem = e.get(0);
  if(elem.validity && !elem.validity.valid){
    //Some browsers support html5 date but give back invalid values as "".
    return false;
  }
  return true;
}

date.newField = function (field, formData){
  var e = fh.renderInput("date", field, formData);
  var locale = "en_US";
  if(formData.ProcessOptions && formData.ProcessOptions.locale){
    locale = formData.ProcessOptions.locale;
  }
  e.data("mktoLocale", locale);
  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:$.proxy(e.val, e),
    validator:function (){
      return checkDate(e);
    },
    required:field.IsRequired,
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
};
},{"../jquery.js":45,"./fieldHelpers.js":29}],33:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");
//pattern from http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
var emailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

var email = {};
module.exports = email;
email.fieldType = "email";
var checkEmail = function (e){
  var val = e.val() || "";
  if(!val){
    return true;
  }
  return val.match(emailPattern);
}
  
email.newField = function (field, formData){
  var e = fh.renderInput("email", field, formData);

  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:$.proxy(e.val, e),
    required:field.IsRequired,
    validator:function (){
      return checkEmail(e);
    },
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}
},{"../jquery.js":45,"./fieldHelpers.js":29}],34:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");


var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var number = {};
module.exports = number;
number.fieldType = "number";

function coerceNumberOrBlank(num){
  //any falsey value except 0 turns to empty string.  Yes, -0 is different than 0 in JS.
  if(!num && num !== 0){
    return '';
  }
  return ''+num;
}

function checkValid(e, min, max){
  var elem = e.get(0);
  if(elem.validity && !elem.validity.valid){
    //Some browsers support html5 but don't support min/max on numbers.
    //For those browsers, we can't trust valid and have to do the rest ourselves.
    return false;
  }
  var v = e.val();
  if(!v){
    return true;
  }
  return checkNumber(v, min, max);
}

function checkNumber(v, min, max){
  if(v === "" || v === null){
    return true;
  }
  v = parseFloat(v, 10);
  if(isNaN(v)){
    return false;
  }

  if(fh.isSet(min) && v < min){
    return false;
  }
  if(fh.isSet(max) && v > max){
    return false;
  }
  return true;
}

function makeValFn(e, min, max){
  return function (v){
    if(arguments.length === 0){
      var val = e.val();
      if(fh.isSet(val)){
        var result = parseFloat(val);
        if(isNaN(result)){
          return "";
        }
        return result;
      }
      return null;
    }else{
      e.val(v);
    }
  }
}

number.newField = function(field, formData){
  var e = fh.renderInput("number", field, formData);
  var wrap = 
  e.attr({
    min:coerceNumberOrBlank(field.MinimumNumber),
    max:coerceNumberOrBlank(field.MaximumNumber),
    step:coerceNumberOrBlank(field.StepNumber)
  });

  return {
    name:field.Name,
    val:makeValFn(e, field.MinimumNumber, field.MaximumNumber),
    elem:fh.formatStandardField(e, field, formData),
    required:field.IsRequired,
    validator:function (v){
      return checkNumber(v, field.MinimumNumber, field.MaximumNumber);
    },
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}

},{"../jquery.js":45,"./fieldHelpers.js":29}],35:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var radio = {};
module.exports = radio;
radio.fieldType = "radio";

var makeValFn = function (e){
  return function (val){
    if(arguments.length === 0){
      var value = e.find("input:checked").val();
      return value;
    }else{
      e.find("input").prop('checked', false);
      if(val !== ""){
        e.find("input[value='"+val+"']").prop('checked', true)  
      }else{
        e.find("input").each(function (i, input){
          input = $(input);
          if(input.val() === ""){
            input.prop("checked", true);
          }
        })
      }
      
    }
  }
}

radio.newField = function (field, formData){
  var e = $b(".mktoRadioList", {title:field.Description}, [
    $.map(field.PicklistValues || [], function (val, i){
      var id = "mktoRadio_" + field.Id + "_" +i;
      if(!i){
        firstVal = val.value;
      }
      return $b.docFrag([
        $b("input[type=radio].mktoField", {
            name:field.Name,
            id:id,
            value:val.value,
            "aria-required":field.IsRequired,
            "aria-labelledby":[fh.getLabelId(field.Name, id), fh.getInstructionId(field.Name)].join(" ")
        }),
        $b("label", {"for":id, "id":fh.getLabelId(id)}, [
          $b.html(val.label || val.name)
        ])
      ])
    })
  ]);
  if(field.IsLabelToLeft){
    e.addClass("mktoLabelToLeft");
  }
  var valFn = makeValFn(e);
  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:valFn,
    required:field.IsRequired,
    validatorElem:e,
    validatorFocusElem:e.find("input:eq(0)"),
    onChange:function (fn){
      e.on("change", fn);
    }
   }
}

},{"../jquery.js":45,"./fieldHelpers.js":29}],36:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");
var Modernizr = require("../modernizr.js");

var range = {};
module.exports = range;
range.fieldType = "range";

var checkValid = function (e, min, max){
  var elem = e.get(0);
  if(elem.validity && !elem.validity.valid){
    //Some browsers support html5 but don't support min/max on numbers.
    //For those browsers, we can't trust valid and have to do the rest ourselves.
    return false;
  }
  var v = e.val();
  if(!v){
    return true;
  }
  return checkNumber(v, min, max);
}

var checkNumber = function (v, min, max){
  v = parseFloat(v, 10);
  if(isNaN(v)){
    return false;
  }
  if(fh.isSet(min) && v < min){
    return false;
  }
  if(fh.isSet(max) && v > max){
    return false;
  }
  return true;
}

var makeValFn = function (e, min, max){
  return function (v){
    if(arguments.length === 0){
      var val = e.val();
      if(fh.isSet(val)){
        var result = parseFloat(val, 10);
        if(isNaN(result)){
          return null;
        }
        return result;
      }
      return null;
    }else{
      if(v === null || v === undefined || v === ""){
        return; //it's not possible to unset a range.
      }
      if(checkNumber(v, min, max)){
        e.val(parseFloat(v, 10));
        e.trigger("change")
      }
    }
  }
}

range.newField = function (field, formData){

  var e, valueText, rangeValue, arrowWrap;

  var min = field.MinimumNumber || 0;
  var max = field.MaximumNumber || 100;
  var wrap = $b(".mktoLogicalField.mktoRangeField", [
    rangeValue = $b(".mktoRangeValue", [
      arrowWrap = $b(".mktoRangeValueArrowWrap", $b(".mktoRangeValueArrow")),
      valueText = $b(".mktoRangeValueText", "" + field.MinimumNumber || 0 )
    ]),
    e = $b("input[type=range].mktoField", {
      id:field.Name,
      name:field.Name,
      min:min,
      max:max,
      step:field.StepNumber || 1,
      title:field.Description,
      "aria-labelledby":[fh.getLabelId(field.Name), fh.getInstructionId(field.Name)].join(" ")
    }).addClass("mktoHasWidth").css({width:fh.first(field.FieldWidth, formData.FieldWidth, 0 )})
  ]).hover(function (){
    wrap.addClass("mktoHover");
    updateValueText();
  },function (){
    wrap.removeClass("mktoHover");
  });
  if(!Modernizr.csstransforms){
    arrowWrap.addClass("mktoArrowImage");
  }
  
  var updateValueText = function (){
    var val = e.val() || 0;
    valueText.html(""+val);
    var dragSliderSize = 12;
    var noCubicEase = e.data("mktoNoCubicEase");
    var pxAboveSlider = e.data("mktoPxAboveSlider") || 0;
    var pctVal =  (val - min)/ (max - min);
    var tgtX = e.width() * pctVal; 

    //this fudging with the tgtX is because the meaning of a range slider's draghandle changes as it slides.
    // -----------[x]-----------  here the center of the draghandle is indicating the value of 50 out of 100
    // [x]----------------------  here the left side of the draghandle is indicating the value of 0 out 100
    // -----------------------[x] here the right side of the draghandle is indicating the value of 100 out of 1000
    //However, we want our popup to always point at the center of the slider.
    //Different browsers implement their sliders differently, so best case is getting close without probably
    //actually ever being exacty right in any browser.  A cubic easing seems to do the job well.
    var fudge = 0;
    if(!noCubicEase){
      if(pctVal < 0.5){
        fudge = Math.pow((1-pctVal), 3) * (dragSliderSize/2);
      }
      if(pctVal > 0.5){
        fudge = -1 * Math.pow(pctVal, 3) * (dragSliderSize/2);
      }
      tgtX += Math.floor(fudge);  
    }
    
    var rangeOffset = tgtX - (rangeValue.outerWidth() / 2);
    var arrowOffset = (valueText.outerWidth() / 2) - (arrowWrap.outerWidth()/ 2 );
    //console.log({ val:e.val(), min:min, max:max, pctVal:pctVal, tgtX:tgtX, width:e.width(), rangeOffset:rangeOffset, rangeWidth:rangeValue.width(), rangeOuterWidth:rangeValue.outerWidth(), valueTextWidth: valueText.outerWidth()} );
    rangeValue.css("margin-left", rangeOffset);
    rangeValue.css("margin-top", -1 * (arrowWrap.outerHeight() + valueText.outerHeight() + pxAboveSlider));
    arrowWrap.css("margin-left", arrowOffset);
  }
  e.on('change', updateValueText);
  e.on('input', updateValueText);
  e.data("mktoRangeUpdate", updateValueText);
  //TODO: should probably be on mktoFormRender event instead.
  $("body").on("mktoRender", updateValueText);
  return {
    name:field.Name,
    val:makeValFn(e, field.MinimumNumber, field.MaximumNumber),
    elem:fh.formatStandardField(wrap, field, formData),
    required:field.IsRequired,
    validator:function (){
      return checkValid(e, min, max);
    },
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}

},{"../jquery.js":45,"../modernizr.js":48,"./fieldHelpers.js":29}],37:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var phonePattern = /^([0-9()+. \t-])+(\s?(x|ext|extension)\s?([0-9()])+)?$/

var tel = {};
module.exports = tel;
tel.fieldType = "phone";
var checkPhone = function (e){
  var val = e.val() || "";
  if(!val){
    return true;
  }
  return val.match(phonePattern);
}
  
tel.newField = function (field, formData){
  var e = fh.renderInput("tel", field, formData);
  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:$.proxy(e.val, e),
    required:field.IsRequired,
    validator:function (){
      return checkPhone(e);
    },
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}
},{"../jquery.js":45,"./fieldHelpers.js":29}],38:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var text = {};
module.exports = text;
text.fieldType = "string";
  
text.newField = function (field, formData){
  var maxlen = field.Maxlength || 255;
  var e = fh.renderInput("text", field, formData);
  if(field.FieldMask){
    e.addClass("mktoInputMask").data("mktoInputMask", field.FieldMask);
  }

  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:function (v){
      if(arguments.length === 0){
        return e.val();
      }else{
        if(v && v.length > maxlen ){
          v = v.substring(0, maxlen);
        }
        return e.val(v);
      }
    },
    required:field.IsRequired,
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}

},{"../jquery.js":45,"./fieldHelpers.js":29}],39:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var url = {};
module.exports = url;
url.fieldType = "url";
var urlCharactersPattern = /^[a-zA-z0-9\.\-_~:/\?#\[\]@!$&\'\(\)\*\+,;=%]*$/

var validateUrl = function (v){
  if(!v){
    return true;
  }
  var protocolEndIdx = v.indexOf("://");
  if(protocolEndIdx < 1){
    return false;
  }
  return v.match(urlCharactersPattern);
}
  
url.newField = function (field, formData){
  var e = fh.renderInput("url", field, formData);

  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:$.proxy(e.val, e),
    required:field.IsRequired,
    validatorElem:e,
    validator:validateUrl,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}

},{"../jquery.js":45,"./fieldHelpers.js":29}],40:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var makeValFn = function (e, isMultiselect){
  return function(val){
    if(arguments.length === 0){
      return e.val();
    }else{
      if(isMultiselect && val && !$.isArray(val)){
        val = fh.splitSemis(val);
      }
      return e.val(val);        
    }
  }
};

var select = {};
module.exports = select;
select.fieldType = "picklist";
select.newField = function (field, formData){
  var e = 
    $b("select.mktoField", {id:field.Name, name:field.Name, title:field.Description,
      "aria-labelledby":[fh.getLabelId(field.Name), fh.getInstructionId(field.Name)].join(" ")}, [
      $.map(field.PicklistValues || [], function (val, i){
        if(!val.isDefault || val.selected){
          return $b("option", {value:val.value}, val.label || val.name);
        }
      })
    ]);
  if(field.IsMultiselect){
    e.attr("multiple", "multiple");
    e.attr("size", field.VisibleRows || 5);
  }

  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:makeValFn(e, field.IsMultiselect),
    required:field.IsRequired,
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}
},{"../jquery.js":45,"./fieldHelpers.js":29}],41:[function(require,module,exports){
var $ = require("../jquery.js");
var $b = $.build;
var fh = require("./fieldHelpers.js");

var textarea = {};
module.exports = textarea;
textarea.fieldType = "textarea";
  
textarea.newField = function (field, formData){
  var maxlen = field.Maxlength || 2000;
  var e = $b("textarea.mktoField", {
      id:field.Name,
      name:field.Name,
      placeholder:field.PlaceholderText,
      rows: Math.max(2, field.VisibleRows || 2),
      title:field.Description,
      "aria-labelledby":[fh.getLabelId(field.Name), fh.getInstructionId(field.Name)].join(" ")
  });
  try{
    e.attr("maxlength", maxlen);
  }catch(ex){
    // broken IE compatibility mode attributes http://bugs.jquery.com/ticket/12577
    e.get(0).setAttribute("maxlength", "" + maxlen);
  }

  return {
    name:field.Name,
    elem:fh.formatStandardField(e, field, formData),
    val:function (v){
      if(arguments.length === 0){
        return e.val();
      }else{
        if(v && v.length > maxlen ){
          v = v.substring(0, maxlen);
        }
        return e.val(v);
      }
    },
    required:field.IsRequired,
    validatorElem:e,
    onChange:function (fn){
      e.on("change", fn);
    }
  }
}
},{"../jquery.js":45,"./fieldHelpers.js":29}],42:[function(require,module,exports){
var $ = require("./jquery.js");
var $b = $.build;
var Validation = require("./validation.js");
var measure = require("./measure.js");
var fh = require("./fields/fieldhelpers.js");
var cap = fh.cap;
var isSet = fh.isSet;
var first = fh.first;
var querystring = require("querystring");
var url = require("url");
var cookie = require("cookie");
var cookieHelper = require("./cookiehelper.js");
var tokenTemplate = require("./tokenTemplate.js");
var changeManager = require("./changeManager.js");
var urlHelper = require("./urlhelper.js");
var prefillCoercer = require("./prefillcoercer.js");
var iframeProxy = require("./iframeproxy.js");
var log = require('./safelog.js');
var shajs = require('sha.js');

var fieldTypes = [
  require("./fields/inputRadio.js"),
  require("./fields/inputDate.js"),
  require("./fields/inputEmail.js"),
  require("./fields/inputCheckbox.js"),
  require("./fields/select.js"),
  require("./fields/inputRange.js"),
  require("./fields/inputText.js"),
  require("./fields/inputUrl.js"),
  require("./fields/inputTel.js"),
  require("./fields/inputNumber.js"),
  require("./fields/textarea.js"),
  require("./fields/currency.js")
];

var fieldTypeMap = {};
$.each(fieldTypes, function (i, type){
  fieldTypeMap[type.fieldType] = type;
});
//Add int and double as aliases for number
fieldTypeMap["int"] = fieldTypeMap.number;
fieldTypeMap["double"] = fieldTypeMap.number;
fieldTypeMap.single_checkbox = fieldTypeMap.checkbox;



var comparators = require("./comparators.js");

//Browser detection... All conditional JS code should NOT use these,
//and should instead use Modernizr to detect support for individual features.
//However, for ease of use when styling we will add .ie6 .ie7 and .ie8 classes into
//the dom to minizimze stylesheet hacks for these three historic bad-boys.
var oldIeMatch =navigator.userAgent.match(/msie ([6789])/i);
var oldIe = oldIeMatch? "ie"+oldIeMatch[1] : "";

// Cache location.href value, to be used later for _mktoReferrer
var originalLocationHref = location.href;
var Form = function (formData, modernizr, opts){
  var pub = {};
  var priv = {};
  priv.hiddenFields = {
    formid:formData.Id
  };
  priv.onSuccess = [];
  priv.onSubmit = [];
  priv.onValidate = [];
  priv.values = {};
  priv.fieldsByName = fh.getFieldsByName(fh.getFlattenedFields(formData));
  priv.changeMap = changeManager.getChangeMap(priv.fieldsByName, formData);
  priv.fieldElemsByName = {};
  priv.latestFieldsByName = {};
  priv.canSubmit = formData.Status != "draft" && !formData.isPreview;

  var updateDependentFields = function (subjectField){
    var dependentFields = priv.changeMap[subjectField] || [];
    var fireRender = false;
    var renderCtx = {
      defaultValuesToSet:{},
      fieldsToCheck:[]
    }
    $.each(dependentFields, function (i, fieldName){
      var currentElem = priv.fieldElemsByName[fieldName];
      if(!currentElem || !currentElem[0] || !$.contains(priv.formElem[0], currentElem[0])){
        //element is in a nested fieldset, or progressive profiling block and fieldset is hidden, so currentElem is not in the DOM tree.
        //We can just bail out here, this field will be processed when the fieldset is re-shown.
        return;
      }
      var currentlyShown = !currentElem.hasClass("mktoPlaceholder");
      var currentField = priv.fieldsByName[fieldName];

      var fieldChangeInfo = changeManager.fieldChangeChecker(currentField.VisibilityRule, pub.getValues());
      var shouldBeShown = fieldChangeInfo.show;

      var updateField = function (field, currentElem){
        var e = renderField(field, renderCtx);
        var colObj = wrapColField(e);
        var newElem = colObj.elem;
        newElem.hide();
        currentElem.replaceWith(newElem);
        if(isSmallViewport()){
          removeFixedWidthContents(newElem);
        }
        // LM-100596: Visibility Rule always check Picklist value against full value list
        // Keep latest field information (picklist values) in storage
        priv.latestFieldsByName[fieldName] = field;
        return newElem;
      };

      var hideField = function (field, currentElem){
        var newElem = $b(".mktoPlaceholder.mktoPlaceholder"+field.Name);
        currentElem.replaceWith(newElem);
        return newElem;
      };

      //If the field is aready shown and set to show...
      //  1. if it is a picklist, filter its picklist values based on the rule.
      //If the field is already shown and set to hide...
      //  1. hide the field
      //If the field is hidden and set to show...
      //  1. filter its picklist values based on the rule.
      //  2. show the field
      //If the field is hidden and set to hide
      //  1. do nothing.

      var f, newElem;
      if(currentlyShown && shouldBeShown){
        f = changeManager.applyPicklistAlterations(currentField, fieldChangeInfo.rule);
        // LM-100596: Visibility Rule always check Picklist value against full value list
        // Only update the field if the rule changes the field object for real
        // Comparison in JSON string, against most recently updated field information
        if(JSON.stringify(f) !== JSON.stringify(priv.latestFieldsByName[fieldName])) {
          newElem = updateField(f, currentElem);
          newElem.show(); //no need to fade in, just show updated field.
          fireRender = true;
        }
      }
      if(currentlyShown && !shouldBeShown){
        newElem = hideField(currentField, currentElem);
        priv.fieldElemsByName[fieldName] = newElem;
        renderCtx.fieldsToCheck.push(currentField);
      }
      if(!currentlyShown && shouldBeShown){
        f = changeManager.applyPicklistAlterations(currentField, fieldChangeInfo.rule);
        newElem = updateField(f, currentElem);
        newElem.show();
        renderCtx.fieldsToCheck.push(currentField);
        fireRender = true;
      }
      if(newElem){
        priv.fieldElemsByName[fieldName] = newElem;
      }

      if(currentField.Datatype == 'fieldset'){
        //if the fieldset was the subject of a show hide, we need to evaluate all its children
        updateDependentFields(currentField.Name);
      }
      if(fireRender && newElem && priv.validation){
        priv.validation.initScoped(newElem);
      }
    });
    pub.setValues(renderCtx.defaultValuesToSet);
    $.each(renderCtx.fieldsToCheck, function (i, field){
      updateDependentFields(field.Name)
    });

    if(fireRender && $("body").data("mktoRendered")){
      //Fire this only it's happening after the initial render.
      $("body").trigger("mktoRender", pub);
    }
  }

  var renderField = function (field, renderCtx){
    var defaultValue = priv.values[field.Name] || field.DefaultValue || field.InputInitialValue;

    if(fieldTypeMap[field.Datatype]){
      var fieldData = fieldTypeMap[field.Datatype].newField(field, formData);
      fieldData.validationMessage = fieldData.validationMessage || field.ValidationMessage;
      fieldData.requiredMessage = fieldData.requiredMessage || field.RequiredMessage;
      if(fieldData.required){
        if(!fieldData.validatorElem){
          throw new Error("Required fields must have a validatorElem");
        }
        fieldData.validatorElem.addClass("mktoRequired");
        if(field.Datatype != 'single_checkbox' && field.Datatype != 'checkbox' && field.Datatype != 'radio'){
          fieldData.validatorElem.attr("aria-required", "true");
        }
      }
      if(priv.changeMap[field.Name]){
        fieldData.onChange(function (e){
          updateDependentFields(field.Name);
        })
      }
      if(isSet(defaultValue)){
        //Defer setting default values until form has all fields rendered, so that
        //dependendent fields for conditional display will be set.
        renderCtx.defaultValuesToSet[field.Name] = defaultValue;
      }
      var descriptor = $b(".mktoFieldDescriptor", fieldData.elem);
      descriptor.data("mktoFieldDescriptor", fieldData);
      return descriptor;
    }else if (field.Datatype == "htmltext" || field.Datatype == "richtext"){
      // REMOVE SCRIPT TAGS
      if ((field.Htmltext || field.InputLabel).includes("<script>")) return;
      return $b.docFrag([
        $b(".mktoOffset.mktoHasWidth").css({width:first(field.OffsetWidth, formData.OffsetWidth, 0)}),
        $b(".mktoFieldWrap",[
          $b(".mktoHtmlText.mktoHasWidth", [$b.html(field.Htmltext || field.InputLabel)])
            .css({
              width: first(field.LabelWidth, formData.LabelWidth, 0)
            }),
          $b(".mktoClear")
        ]),
        $b(".mktoClear")
      ]);
    }else if (field.Datatype == "hidden"){
      var ch = field.InputSourceChannel;
      var sel = field.InputSourceSelector;
      var name = field.Name;
      var value = "";
      if(ch == "url" && sel){
        var qsObj = querystring.parse(location.search.replace("?", ""));
        value = qsObj[sel] || ""
      }else if (ch == "cookie" && sel){
        var cook = cookie.parse(document.cookie);
        value = cook[sel];
      }else if (ch == "referrer" && sel){
        var urlObj = url.parse(document.referrer, true);
        value = urlObj.query[sel];
      }
      if(!value && defaultValue){
        value = defaultValue;
      }
      renderCtx.defaultValuesToSet[name] = value;
      return makeHiddenField(value, name);
    }
    else if (field.Datatype == "fieldset"){
      var fieldsetRows = formData.fieldsetRows[field.Id.toString()] || [];
      if(!fieldsetRows.length){
        return null;
      }
      var fieldElem = $b("fieldset",[
        $b("legend", $b.html(field.InputLabel)),
        $.map(fieldsetRows, function (row, i){
          return renderRow(row, i, renderCtx);
        })
      ]);
      if(fieldsetRows.length && fieldsetRows[0].length){
        fieldElem.css({"padding-right":first(fieldsetRows[0][0].OffsetWidth,formData.OffsetWidth,0)})
      }
      return fieldElem;
    }
    else if(field.Datatype=="profiling"){
      return;
    }else {
      log("invalid data type: "+ field.Datatype);
    }
  }

  var renderProfiling = function (field, renderCtx){
    //see if we have values for any of the fieldset rows.
    //Evict all fields that don't have a value set.
    //Evict all fieldset rows that have no fields, up until you hit the profiling Field Number
    //then render the resulting data as normal rows.

    var po = formData.ProcessOptions;
    var profilingNum = 0;
    if(po && po.profiling && po.profiling.numberOfProfilingFields){
      profilingNum = po.profiling.numberOfProfilingFields;
    }
    var maxFields = field.ProfilingFieldNumber || profilingNum;
    var fieldsetRows = formData.fieldsetRows[field.Id.toString()] || [];
    var cleanfieldsetRows = [];
    var fieldCount = 0;
    $.each(fieldsetRows, function (i, row){
      var cleanFields = [];
      var filledFields = [];
      if(formData.filledFields){
        filledFields = formData.filledFields;
      }
      $.each(row, function (j, f){
        if(!isSet(priv.values[f.Name]) && $.inArray(f.Name, filledFields) == -1 && fieldCount < maxFields){
          cleanFields.push(f);
          fieldCount++;
        }
      });
      if(cleanFields.length > 0){
        cleanfieldsetRows.push(cleanFields);
      }
    });
    return $b.docFrag($.map(cleanfieldsetRows, function (row, i){
      return renderRow(row, i, renderCtx)
    }));
  }

  var wrapColField = function (fieldElem){
    var fieldWidth = 0;
    var colElem;
    if(fieldElem.nodeType == 11){
      colElem = $b(".mktoFormCol", fieldElem);
    }else{
      colElem = fieldElem.addClass("mktoFormCol");
    }
    fieldWidth += measure.measure(colElem).w;
    colElem.css("margin-bottom", formData.LineMargin || 0);
    return {elem:colElem, width:fieldWidth}
  }

  var renderRow = function (row,i,renderCtx){
    var rowWidth = 0;
    //special case for profiling
    //it is always the only field in its row
    //and will end up rendering child rows, but without any wrappers.
    if(row.length == 1 && row[0].Datatype == "profiling"){
      return renderProfiling(row[0], renderCtx);
    }
    var childRows = $.map(row, function (field, j){
        var fieldElem = renderField(field, renderCtx);
        if(!fieldElem){
          return null;
        }
        var colObj = wrapColField(fieldElem);
        rowWidth += colObj.width;

        if(field.VisibilityRule && field.Datatype != "hidden"){
          renderCtx.fieldsToCheck.push(field);
        }

        priv.fieldElemsByName[field.Name] = colObj.elem;
        return colObj.elem;
      });
    if(childRows.length === 0){
      return null;
    }

    var rowElem = $b(".mktoFormRow", [
      childRows,
      $b(".mktoClear")
    ]);
    if(rowWidth > priv.formWidth){
      priv.formWidth = rowWidth;
    }
    return rowElem;
  };

  var makeHiddenField = function (value, key){
    var e = $b("input.mktoField.mktoFieldDescriptor", {type:"hidden", name:key});
    var fieldData = {
      name:key,
      val:$.proxy(e.val, e),
      onChange:function (fn){
        e.on("change", fn);
      }
    };
    if(priv.changeMap[key]){
      fieldData.onChange(function (e){
        updateDependentFields(field.Name);
      })
    }
    e.data("mktoFieldDescriptor", fieldData);
    return e;
  }

  var addHiddenFields = function (formElem, obj){
    var hiddensToAdd = {};
    var ifNotExistFn = function (name, value){
      hiddensToAdd[name] = value;
    }
    pub.setValues(obj, ifNotExistFn);

    var hiddens = $.map(hiddensToAdd, makeHiddenField);

    formElem.append($b.docFrag(hiddens));
    pub.setValues(obj);
  };

  var isSmallViewport = function (){
    if(window.matchMedia && $("body.mktoMobileShow").length){
      return window.matchMedia("only screen and (max-width:480px), only screen and (max-device-width:480px), only screen and (max-device-height:480px)").matches;
    }
    return $(window).width() <= 480
  }

  var removeFixedWidthContents = function (elem){
    var elems = elem.find(".mktoHasWidth").addBack();
    elems.each(function (){
          var e = $(this);
          e.data("mktoFixedWidth", e.css("width"));
          e.css("width", "");
        });
  };

  var onResize = function (){
    if(!priv.formElem){
      return;
    }
    var winW = $(window).width();
    if(!priv.hasRemovedWidths){
      if(isSmallViewport()){
        removeFixedWidthContents(priv.formElem);
        priv.hasRemovedWidths = true;
      }
    }else{
      if(!isSmallViewport()){
        priv.formElem.find(".mktoHasWidth").addBack().each(function (){
          var e = $(this);
          e.css("width", e.data("mktoFixedWidth"));
        })
        priv.hasRemovedWidths = false;
      }
    }
  };

  var buildButtonElem = function (formElem){
    var buttonStyle = formData.ButtonStyle || {className:""}
    var buttonText = formData.ButtonText || formData.SubmitLabel || "Submit";
    var buttonLocation = formData.ButtonLocation || "";
    var blInt = parseInt(buttonLocation, 10) || 0;
    var btn = $b("span.mktoButtonWrap", [
            $b("button.mktoButton", {type:"submit"}, [
              buttonText
            ])
          ]).addClass(buttonStyle.className).css({"margin-left":blInt+"px"});
    return btn;
  };

  var renderSocialSignOn = function(){
    var po = formData.ProcessOptions;
    if(!po || !po.socialSignOn || !po.socialSignOn.isEnabled || !po.socialSignOn.enabledNetworks.length){
      return "";
    }
    var id = po.socialSignOn.cfId +"_SocialSignOn";
    var elem = $b(".cf_widgetLoader.cf_w_"+ id);
    if(window.cf_scripts && window.CF){
      setTimeout(function (){
        CF.widget.restart(id);
      }, 10);
      return elem;
    }
    return $b.docFrag([
      $b("script", {src:formData.loaderJsUrl, type:"text/javascript"}),
      elem
    ]);
  };

  var addFormClasses = function (formElem){
    formElem.addClass("mktoForm mktoHasWidth mktoLayout"+ cap(formData.Layout || "left") + (modernizr.csschecked ? "" : " mktoNoCheckedSupport"));
    if(oldIe){
      formElem.addClass(oldIe);
    }
  }

  var onSuccess = function (values, followup){
    var ok = true;
    $.each(priv.onSuccess, function (i, successFn){
      if(successFn(values, followup) === false){
        ok = false;
      }
    });
    return ok;
  };


  var getSyndId = function (cook){
    var cd = cook.__cdrop;
    var parts;
    if(cd){
      parts = cd.split(".");
      if(parts.length == 3){
        return parts[2];
      }
    }
    return null;
  };

  //The form submission code expects array objects to have "[]" in their parameter name.
  //So with the object {foo:["bar", "baz"]} instead of the natural form encoding
  //foo=bar&foo=baz
  //it expects
  //foo[]=bar&foo[]=baz
  var funkifyArrayParams = function (obj){
    var newObj = {};
    $.each(obj, function (k, v){
      if($.isArray(v) && v.length > 1){
        newObj[k+"[]"] = v;
      }else{
        newObj[k] = v;
      }
    });
    return newObj;
  }

  var isFBTab = function (){
    var l = location;
    return l.hostname.indexOf(opts.fbTabDomain) != -1 && l.search.indexOf("fbTab=1") != -1
  }


  var findCorrectFollowUpUrl = function (data){
    var fbTab = isFBTab();

    var u = "";
    if(data){
      // Newer forms have the ID for the followup page defined as a hidden field, ignore the followup URL in the formData
      // Otherwise, "followupLpId" value can be undefined/null, or -1 in case external URL (formData.FomrFOllowup) is used.
      var isNewStyleFollowup = (pub.getValues().followupLpId > 0);
      if(!isNewStyleFollowup && typeof formData.FormFollowup == "string"){
        u = formData.FormFollowup;
        if(fbTab && u.indexOf("https://") !== 0){
          //If you're on a FB tab and you've specified a landing page defined url and you didn't use https,
          //then we're assuming that you're using a landing page follow up page url.
          u = urlHelper.remapLandingPageUrl(u, location.href);
          u = urlHelper.addQueryParams(u, {fbTab:"1"});
        }
      }else{
        if(data.followUpUrl && typeof data.followUpUrl == "string"){
          u = data.followUpUrl;
        }else if(data.followUpUrl && data.followUpUrl.url){
          if(fbTab && data.followUpUrl.isLandingPage){
            u = urlHelper.remapLandingPageUrl(data.followUpUrl.url, location.href);
            u = urlHelper.addQueryParams(u, {fbTab:"1"});
          }else{
            u = data.followUpUrl.url;
          }
        }
      }
    }

    u = u || location.href;
    if (data.aliId){
      u = urlHelper.addQueryParams(u, {aliId:data.aliId});
    }
    return u;
  }

  var doAjaxSubmit = function (){
    var values = pub.getValues();
    if(window.Munchkin){
      try{
        window.Munchkin.createTrackingCookie(true);
      }catch(e){
        //For IE 7
      }
    }
    var currPageQS = url.parse(originalLocationHref, true).query;

    var cook = cookie.parse(document.cookie);
    var hostname = url.parse(formData.action).hostname;
    var submitUrl = (hostname ? "//" + hostname : '') + opts.formSubmitPath;
    var l = window.location;
    if(isFBTab()){
      //FB tabs use local urls to submit.
      submitUrl = opts.formSubmitPath;
      hostname = location.hostname;
    }
    var dataType = "json";
    var type = "POST";
    if(values._mkt_trk === undefined){
      values._mkt_trk = cook._mkto_trk;
    }
    values.formVid = formData.Vid;
    if(currPageQS.mkt_tok && values.mkt_tok === undefined){
      values.mkt_tok= currPageQS.mkt_tok;
    }
    var syndId = getSyndId(cook);
    if(syndId){
      values.MarketoSocialSyndicationId = syndId;
    }
    values._mktoReferrer = originalLocationHref;

    var checksum = [], fields = [];
    var createChecksumField = function(formData) {
      var fieldCounter = 0;
      $.each(formData, function(i, field){
        if(fieldCounter >= 20) {
          return;
        }
        checksum.push(field);
        fields.push(i);
        fieldCounter++;
      });
    };
    createChecksumField(values);
    values.checksumFields = fields.join(',');
    values.checksum = shajs('sha256').update(checksum.join("|")).digest('hex');
    if (priv.captchaToken) {
      values.captchaToken = priv.captchaToken;
    }
    var valueString = querystring.stringify(funkifyArrayParams(values));

    var formFollowupRedirection = function (data){
      var u = findCorrectFollowUpUrl(data);
      if (false === onSuccess(values, u)) {
        return;
      }
      cookieHelper.removeCookieAllDomains("_mkto_purl");
      location.href = u;
    }
    
    var success = function (data){
      if(data.error){
        onError(data);
      }else if(data.formId){
        if (data.followupStreamValue && window.AdobeDX && window.AdobeDX.conversationalForms) {
          var formSubmittedData = pub.getValues();
          var conversationalAdobeDxObject = {
            id: data.followupStreamValue,
            type: data.deliveryType || 'popup'
          };
          if (formSubmittedData && formSubmittedData.Email) {
            conversationalAdobeDxObject.content = {
                form: {
                  emailAddress: formSubmittedData.Email
                }
            };
          }
          if (data && data.conversationalFieldAttributes) {
            $.each(data.conversationalFieldAttributes, function (formKey, formValue){
              conversationalAdobeDxObject.content.form[formKey] = formValue;
            });
          }
          var adobeDX = window.AdobeDX.conversationalForms(conversationalAdobeDxObject);
          if (
            adobeDX.registerCallback &&
            adobeDX.Enum &&
            adobeDX.Enum.Events &&
            adobeDX.Enum.Events.CONVERSATION_CLOSED &&
            adobeDX.Enum.CallbackType &&
            adobeDX.Enum.CallbackType.EVENT_LISTENER
          ) {
            var addListener = window.AdobeDX.addListener;
            if (addListener) {
              addListener(
                adobeDX.Enum.Events.CONVERSATION_CLOSED,
                function(event) {
                  formFollowupRedirection(data);
                }
              );
            }
          }
        } else {
          formFollowupRedirection(data);
        }
      }
    }
    function decode_utf8(s) {
      return decodeURIComponent(escape(s));
    }
    var encodeHtmlEntity = function(str) {
      var val = [];
      for (var i=str.length-1;i>=0;i--) {
        val.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
      }
      return val.join('');
    };
    var onError = function (err){
      var invalidMsg = formData.formSubmitFailedMsg || 'Submission failed, please try again later.';
      if (err.errorType === 'invalid') {
        if (err.invalidInputMsg) {
          err.invalidInputMsg = decode_utf8(err.invalidInputMsg);
        }
        invalidMsg = err.invalidInputMsg || formData.invalidInputMsg || 'Invalid input';
      }
      var showedFieldError = false;
      if (err && err.errorFields && err.errorFields.length) {
        var fieldName = err.errorFields[0];
        if (fieldName) {
          var fieldElem = priv.fieldElemsByName[fieldName];
          if (fieldElem) {
            var fieldData = fieldElem.data("mktoFieldDescriptor");
            if(fieldData && fieldData.validatorElem){
              priv.validation.showError(fieldData.validatorElem, encodeHtmlEntity(invalidMsg));
              showedFieldError = true;
            }
          }
        }
      }
      
      if(priv.submitButton){
        var btn = priv.submitButton.find("button");
        btn.removeAttr('disabled');
        btn.html(formData.ButtonText || formData.SubmitLabel || "Submit");
        if (!showedFieldError) {
          priv.validation.showError(btn, invalidMsg);
        }
      }
    }

    var ajaxParams = {
        type:type, data:valueString, dataType:dataType,
        url:submitUrl, success:success, error:onError
      };

    function errorWrap(resp, code, msg) {
      var err;
      if (resp && resp.responseJSON) {
        err = resp.responseJSON;
      } else if (resp && resp.responseText) {
        try {
          err = JSON.parse(resp.responseText);
        } catch (e) {
          err = msg;
        }
      } else {
        err = msg;
      }
      onError(err);
    } 

    if(hostname && hostname != location.hostname){
      if(!modernizr.postmessage || !modernizr.json){
        ajaxParams.dataType = "jsonp";
        ajaxParams.submitUrl+="?callback=?";
        ajaxParams.type = "GET";
        ajaxParams.error = errorWrap;
        $.ajax(ajaxParams);
      }
      else{
        iframeProxy.send(ajaxParams);
      }
    }else{
      ajaxParams.error = errorWrap;
      $.ajax(ajaxParams);
    }
  };

  var onSubmit = function (e){
    var submitFn = function(valid) {
      //disable submit button elem.
      if (priv.submitButton) {
        var btn = priv.submitButton.find("button");
        btn.attr('disabled', 'disabled');
        if (formData.ButtonSubmissionText) {
          btn.html(formData.ButtonSubmissionText);
        }
      }
      doAjaxSubmit();
      return false;
    }

    var valid = pub.validate();
    if (priv.canSubmit && valid && priv.onSubmit){
      $.each(priv.onSubmit, function (i, fn){
        fn(pub);
      });
    }
    e.preventDefault();
    if (!priv.canSubmit || !valid){
      e.stopPropagation();
      return false;
    }
    else if (formData.EnableCaptcha && formData.Captcha && formData.Captcha.provider !== "disabled" && (!priv.captchaToken || priv.captchaToken === "")) {
      if (formData.Captcha.provider == 'reCaptcha') {
        grecaptcha.ready(function () {
          grecaptcha.execute(formData.Captcha.siteKey, {action: 'submit'}).then(function (token) {
            return submitFn(true);
          });
        });
      }
      // This will uncommented when hCaptcha is available to configure
      // else if(formData.Captcha.provider == 'hCaptcha') {
      //   if(formData.Captcha.invisible) {
      //     hcaptcha.execute();
      //     valid = true;
      //     validateAndSubmit();
      //   }
      //   else {
      //     pub.showErrorMessage("Please complete the hCaptcha prior to submitting this form", priv.submitButton.find("button"));
      //   }
      // }
      //}
      e.stopPropagation();
    }
    else {
      return submitFn(true);
    }
    return false;
  };

  var renderTemplateButton = function (attrs){
    var buttonStyle = formData.ButtonStyle || {className:""};
    var btn = $b("span.mktoButtonWrap", [
      $b("button.mktoButton", {type:"submit"}, [
        attrs["default"] || ""
      ])
    ]).addClass(buttonStyle.className)
    btn.click(function (e){
      onSubmit(e);
      e.preventDefault();
    });
    return btn;
  };

  var renderNotYouButton = function (attrs){
    return $b("a.mktoNotYou", [attrs["default"] || "Not You?"]).click(
      function (){
        //unset _mkto_trk cookie, remove mkt_tok and aliId params, reload page.
        cookieHelper.removeCookieAllDomains("_mkto_trk");
        location.href = urlHelper.removeQueryParams(location.href, ["mkt_tok", "aliId"]);
    });
  };

  var renderTokenizedTemplate = function (){
    var templ = formData.ProcessOptions.knownLead.template;
    //The token parsing code in MLM eats its own tokens.  To get around this, we alter the token format
    //The real format is {{tag}}, but we change it to {[(tag)]}
    templ = templ.replace(/\{\[\((.*?)\)\]\}/g, "{{$1}}");
    var swaps = {};
    var count = 0;
    var swapForHtmlPlaceholder = function (fn){
      return function (){
        var result = fn.apply(null, arguments);
        if(result.jquery || result.nodeType){
          var id = "__tempSwap"+count;
          count++;
          swaps[id] = result;
          return "<span id='"+id+"'></span>";
        }
        return result;
      }
    }

    var htmlSafe = function(leadData){
      $.each(leadData, function (k, v){
        leadData[k] = $('<div />').text(leadData[k]).html();
      });
      return leadData;
    }

    var model = {
      lead:htmlSafe(formData.knownLead),
      form:{
        Button:swapForHtmlPlaceholder(renderTemplateButton),
        NotYou:swapForHtmlPlaceholder(renderNotYouButton)
      }
    };
    var template = $b("div.mktoTemplateBox", $b.html(tokenTemplate(templ, model)));
    $.each(swaps, function (k, v){
      template.find("#"+k).replaceWith(v);
    });
    return template;
  }

  var rerender = function(){
    if(priv.formElem){
      priv.formElem.empty();
    }
    pub.render(priv.formElem);
  }

  pub.render = function (formElem){
    priv.id = formData.Vid || formData.Id || 1;
    if(!formElem){
      formElem = $("form#mktoForm_"+ (formData.Vid || formData.Id));
    }
    if(!formElem.length){
      formElem = $b("form#mktoForm_"+(formData.Vid || formData.Id));
    }
    priv.formElem = formElem;

    //Firefox and Webkit don't agree on how to style form validation messages
    //And IE < 9 don't support them at all.  Sadly, it's easier to just turn
    //off HTML5 form validation and do it all manually with JS.  Maybe in another
    //year, that won't be the case any more.
    formElem.attr({
      "novalidate":"novalidate"
    });
    formElem.css({
      "font-family":formData.FontFamily || "",
      "font-size":formData.FontSize || "",
      "color":formData.FontColor || ""
    });
    //Set up all the styles before initing the measuring element that we'll use to capture column widths.
    addFormClasses(formElem);
    measure.init(priv.formElem);

    priv.formWidth = 0;
    var renderCtx = {
      defaultValuesToSet: {},
      fieldsToCheck: []
    }
    var rowElems = $.map(formData.rows, function (row, i){
      return renderRow(row, i, renderCtx);
    });

    var socialSignOn = renderSocialSignOn();

    $.each(renderCtx.fieldsToCheck, function (i, field){
      if(!changeManager.fieldChangeChecker(field.VisibilityRule, renderCtx.defaultValuesToSet).show){
        var plh = $b(".mktoPlaceholder.mktoPlaceholder"+field.Name);
        var elem = priv.fieldElemsByName[field.Name];
        if(elem){
          elem.replaceWith(plh);
          priv.fieldElemsByName[field.Name] = plh;
        }
      }
    });


    var buttonCss = "";
    var bs = formData.ButtonStyle;
    if(bs){
      if(bs.css){
        buttonCss += bs.css
      }
      if(bs.buttonColor){
        //This background color support is lame.  It should really come prebaked in the ButtonStyle.css
        buttonCss += "\n.mktoForm .mktoButtonWrap."+bs.className+" button.mktoButton {background:"+bs.buttonColor + ";}\n";
      }
    }
    formElem.append($b("style", {type:"text/css"}, buttonCss));
    if (formData.knownLead && formData.ProcessOptions && formData.ProcessOptions.knownLead && formData.ProcessOptions.knownLead.type == "custom"){
      formElem.append(renderTokenizedTemplate());
      var elmsKnown = [];
      if (formData.EnableCaptcha && formData.Captcha && formData.Captcha.provider !== "disabled") {
        var captchaHTML1 = addCaptchaScript(formElem, formData);
        if(captchaHTML1) {
          captchaHTML1.forEach(function(item) {
            elmsKnown.push(item);
          });
        }
      }
      formElem.append($b.docFrag(elmsKnown));
    } else {
      var elms = [
        socialSignOn,
        rowElems
      ];
      var submitBtn = $b(".mktoButtonRow", [
        priv.submitButton = buildButtonElem(formElem)
      ]);
      if (formData.EnableCaptcha && formData.Captcha && formData.Captcha.provider !== "disabled") {
        var captchaHTML = addCaptchaScript(formElem, formData, submitBtn);
        if(captchaHTML) {
          captchaHTML.forEach(function(item) {
            elms.push(item);
          });
        }
      }
      elms.push(submitBtn);

      //Add Dynamic Chat js in case of embbeded form 
      if (formData.dcJsUrl) {
        var elem2 = $b("div");
        elem2.append('<script type="text/javascript" src="' + formData.dcJsUrl + '"></script>');
        elms.push(elem2);
      }
      formElem.append($b.docFrag(elms));
      if (formData.removeDuplicateLabelId) {
        var Checkboxlabel = formElem.find('input[type="checkbox"]').next('label');
        for (i = 0; i < Checkboxlabel.length; i++) {
          if (Checkboxlabel[i].innerText ==="") {
            Checkboxlabel[i].removeAttribute("id");
          }
        }
        var Radiolabel = formElem.find('input[type="radio"]').next('label');
        for (i = 0; i < Radiolabel.length; i++) {
          if (Radiolabel[i].innerText ==="") {
            Radiolabel[i].removeAttribute("id");
          }
        }
      }
    }

    addHiddenFields(formElem, priv.hiddenFields);

    pub.setValues(renderCtx.defaultValuesToSet);

    formElem.css({
      "width": Math.max(priv.submitButton ? priv.submitButton.outerWidth(): 0, priv.formWidth + 1)  //TODO: Figure out why things wrap wrong without adding 1 extra px.
    });

    formElem.on("submit", onSubmit);

    priv.validation = Validation(formElem);
    priv.validation.init();
    setTimeout(function (){
      $("body").trigger("mktoRender", pub).data("mktoRendered", true);
    },0);

    $(window).on("resize", onResize);
    onResize();

    if(oldIe == "ie7"){
      fixIEZIndex(formElem);
    }

    return formElem;
  };

  addCaptchaScript = function(formElem, formData) {
    var cSettings = {
      'id': 'captcha',
      'class': '',
      'data-callback': 'captchaCallback',
      'data-expired-callback': 'captchaExpired',
      'data-sitekey': ''
    };
    var providers = {
      'hCaptcha' : {
        cls: 'h-captcha',
        scriptSrc: "https://js.hcaptcha.com/1/api.js?onload=captchaCallback"
      },
      'reCaptcha' :{
        cls: 'g-recaptcha',
        scriptSrc: "https://www.google.com/recaptcha/api.js?onload=captchaCallback"
      }
    }
    var ec = formData.EnableCaptcha && formData.Captcha && formData.Captcha.provider !== "disabled";
    if (!ec){
      return "";
    }
    var onCaptchaSuccess = function(response) {
      var items = document.getElementsByClassName("grecaptcha-badge");
      if (items.length > 0) {
        for (var i = 0; i < items.length; i++) {
          items[i].style.visibility = 'hidden';
        }
      }
      if (response) {
        var form = this.MktoForms2.getForm(formId);
        if (form) {
          form.setCaptchaValue(response);
        }
      }
    }

    cSettings['data-sitekey'] = formData.Captcha.sitekey;
    cSettings.class = providers[formData.Captcha.provider].cls;
    var captchaScript = $b("script", {
      src: providers[formData.Captcha.provider].scriptSrc,
      type: "text/javascript",
      async: true,
      defer: true
    });
    var elem2 = $b("div");
    var callBackScript = '<script type="text/javascript">';
    callBackScript += 'var formId = ' + formData.Vid + ';';
    callBackScript += 'var captchaCallback = ' + onCaptchaSuccess + ';';
    callBackScript += '</script>';
    elem2.append(callBackScript);

    if (formData.Captcha.provider == 'reCaptcha') {
      cSettings['data-size'] = 'invisible';
    }

    var disclaimer = '';
    if (formData.Captcha.provider == 'reCaptcha') {
      disclaimer = $b("div.mktoCaptchaDisclaimer");
      disclaimer.append("This site is protected by reCAPTCHA and the Google\n" +
        " <a href=\"https://policies.google.com/privacy\" target=\"_blank\">Privacy Policy</a> and" +
        " <a href=\"https://policies.google.com/terms\" target=\"_blank\">Terms of Service</a> apply.");
    }

    var captchaDiv = $b("<div>", cSettings);
    return [
       captchaScript, elem2, captchaDiv, disclaimer
    ];
  }
  //Todo: move this to a polyfill that is dynamically loaded for only the chumps who use IE7
  //or IE in "compatibility mode".
  var fixIEZIndex = function(formElem){
    var fields = formElem.find(".mktoFormRow, .mktoFormCol");
    var count = fields.length;
    fields.each(function (){
      $(this).css("z-index", count--);
    });
    formElem.css("z-index", fields.length + 1);
  };

  pub.getId = function (){
    return priv.id;
  };

  pub.getFormElem = function (){
    return priv.formElem;
  };
  //less verbose;
  pub.getElem = pub.getFormElem();

  pub.validate = function (){
    var ok = priv.validation.check();
    $.each(priv.onValidate, function (i, fn){
      fn(ok);
    });
    return ok;
  };

  pub.onValidate = function (callback){
    if(!callback){
      priv.onValidate = [];
    }else{
      priv.onValidate.push(callback);
    }
    return pub;
  };

  pub.offValidate = function (callback){
    priv.onValidate = priv.onValidate.filter(function (v){
      return v !== callback;
    });
    return pub;
  }

  pub.submit = function (oneTimeSuccessCallback){
    if(oneTimeSuccessCallback && typeof oneTimeSuccessCallback === 'function'){
      var cb = function (){
        pub.offSuccess(cb);
        oneTimeSuccessCallback.apply(null, arguments);
      }
      priv.onSuccess.push(cb);
    }
    priv.formElem.trigger("submit");
    return pub;
  };

  pub.onSubmit = function (callback){
    if(!callback){
      priv.onSubmit = [];
    }else{
      priv.onSubmit.push(callback);
    }
    return pub;
  };

  pub.offSubmit = function (callback){
    priv.onSubmit = priv.onSubmit.filter(function (v){
      return v !== callback;
    });
    return pub;
  };

  pub.onSuccess = function (callback){
    if(!callback){
      priv.onSuccess = [];
    }else{
      priv.onSuccess.push(callback);
    }
    return pub;
  };

  pub.offSuccess = function (callback){
    priv.onSuccess = priv.onSuccess.filter(function (v){
      return v !== callback;
    });
    return pub;
  };

  pub.submitable = function (canSubmit){
    if(!arguments.length){
      return priv.canSubmit;
    }
    else{
      priv.canSubmit = canSubmit;
      return pub;
    }
  };
  //Fix spelling
  pub.submittable = pub.submitable;

  pub.allFieldsFilled = function (){
    var vals = pub.getValues();
    var ok = true;
    $.each(vals, function (i, val){
      if($.isArray(val) && val.length === 0){
        ok = false;
      }else if(val === undefined || val === null || val === ""){
        ok = false;
      }
    });
    return ok;
  };

  var getFieldNameValFnMap = function (){
    var nameMap = {};
    priv.formElem.find(".mktoFieldDescriptor").each(function (i, elem){
      var e = $(elem);
      var f = e.data("mktoFieldDescriptor");
      nameMap[f.name] = f.val;
    })
    return nameMap;
  };

  pub.setValuesCoerced = function (prefillObj){
    var coerced = prefillCoercer.coerceTypes(prefillObj, formData);
    pub.setValues(coerced);
  }

  pub.setValues = function (obj, ifNotExistFn){
    if(!priv.formElem){
      priv.values = obj;
    }else{
      var dependencies = [];
      var nameMap = getFieldNameValFnMap();
      $.each(obj, function (name, value){
        if(nameMap[name]){
          nameMap[name](value);
        }else if(ifNotExistFn){
          ifNotExistFn(name, value);
        }
        if(priv.changeMap[name]){
          dependencies.push(name);
        }
      });
      $.each(dependencies, function (i, fieldName){
        updateDependentFields(fieldName);
        var nameMap = getFieldNameValFnMap();
        $.each(priv.changeMap[fieldName], function(i, child){
          if(nameMap[child] && obj[child] !== undefined){
            nameMap[child](obj[child]);
          }
        })
      })
    }
    return pub;
  };

   pub.setCaptchaValue = function(resp) {
     if (priv) {
       priv.captchaToken = resp;
       //enable submit button
       if (priv.submitButton) {
         var btn = priv.submitButton.find("button");
         btn.removeAttr('disabled');
       }
     }
   };

  pub.setCaptchaExpired = function() {
    if (priv) {
      priv.captchaToken = '';
      // re-disable button
      if (priv.submitButton) {
        var btn = priv.submitButton.find("button");
        btn.attr('disabled', 'disabled');
      }
    }
  };

  pub.addHiddenFields = function (obj){
    if(!priv.formElem){
      $.extend(priv.hiddenFields, obj);
    }else{
      addHiddenFields(priv.formElem, obj);
    }
  };

  pub.getValues = function (){
    if(!priv.formElem){
      return priv.values;
    }else{
      var vals = {};
      var nameMap = getFieldNameValFnMap();
      $.each(nameMap, function (name, val){
        var value = val();
        vals[name] = value;
      });
      return vals;
    }
  };

  pub.vals = function (){
    if(arguments.length === 0){
      return pub.getValues();
    }
    return pub.setValues.apply(null, arguments);
  };

  pub.showErrorMessage = function (msg, elem){
    if(priv.validation){
      if(!elem){
        elem = priv.submitButton;
      }
      priv.validation.showError(elem, msg);
    }
    return pub;
  };

  pub.setErrorMessages = function (obj){
    $.each(obj, function (fieldName, message){
      priv.fieldsByName[fieldName].ValidationMessage = message;
      if(priv.formElem){
        var elem = priv.fieldElemsByName[fieldName];
        if(elem){
          var data = elem.data("mktoFieldDescriptor");
          if(data){
            data.validationMessage = message;
            elem.data("mktoFieldDescriptor", data);
          }
        }
      }
    });
  }

  return pub;
}

module.exports = Form;

},{"./changeManager.js":24,"./comparators.js":26,"./cookiehelper.js":27,"./fields/currency.js":28,"./fields/fieldhelpers.js":30,"./fields/inputCheckbox.js":31,"./fields/inputDate.js":32,"./fields/inputEmail.js":33,"./fields/inputNumber.js":34,"./fields/inputRadio.js":35,"./fields/inputRange.js":36,"./fields/inputTel.js":37,"./fields/inputText.js":38,"./fields/inputUrl.js":39,"./fields/select.js":40,"./fields/textarea.js":41,"./iframeproxy.js":44,"./jquery.js":45,"./measure.js":46,"./prefillcoercer.js":49,"./safelog.js":50,"./tokenTemplate.js":52,"./urlhelper.js":53,"./validation.js":54,"cookie":4,"querystring":13,"sha.js":16,"url":23}],43:[function(require,module,exports){
if(typeof window !== 'undefined' && window.MktoForms2){
  //This prevents re-executing the script if the customer has inserted the script block twice;
  module.exports = window.MktoForms2;
  return;
}
var $ = require("./jquery.js");
// LM-113876: avoid conflicting with global jquery
$.noConflict();
var $b = require("jquery.build")($, document);
var Form = require("./form.js");
require("./shimsham.js");
var forms2 ={};
forms2.$ = $;
forms2.$b = $b;
forms2.Modernizr = require("./modernizr.js");
var modernizr = forms2.Modernizr;
var qs = require("querystring");
var fh = require("./fields/fieldhelpers.js");
var cookie = require("cookie");
var events = require("events");
var emitter = new events.EventEmitter();
var urlApi = require("url");
var iframeProxy = require("./iframeproxy.js");
var color = require("./color.js");
var log = require("./safelog.js");
var getLatestForm = true;

var opts = {
  rootUrl:"",
  baseUrl:"/js/forms2/",
  skipPolyfills:false,
  formSubmitPath:"/index.php/leadCapture/save2",
  formXDPath:"/index.php/form/XDFrame",
  fbTabDomain:"marketo.com"
}
var forms = [];

forms2.setOptions = function (_opts){
  $.extend(opts, _opts);
};

/* 
 * We test to see if both the theme style and base style have been loaded
 * We do this by checking to see if the border color and color on an 
 * element with id=mktoStyleLoaded are equal to #123456.
 */

var waitForCssLoad = function (callback){
  var tester = $b("#mktoStyleLoaded").css({
    "display":"none",
    "border-top-color":"#123456"
  }).appendTo($("body"));
  var loadCount = 0;
  var timeout = 1500; 
  var interval = 25;

  var checkLoad = function (){
    var fgColor = tester.css("color");
    var bgColor = tester.css("background-color");
    var borderColor = tester.css("border-top-color");
    if(loadCount > timeout /interval){
      log('Timeout loading CSS. #mktoStyleLoaded missing color #123456 for one of color, background-color, or border-top-color.', fgColor, bgColor, borderColor);
      callback();
    }else if (color.compareColor(borderColor, bgColor) && color.compareColor(borderColor, fgColor)){
      defer(callback);
    }else{
      loadCount++;
      setTimeout(checkLoad, interval);
    }
  }
  checkLoad();
}

var addStyle = function (id, url){
  if(url.indexOf("//") === 0){
    url = location.protocol + url;
  }
  var l = $b("link", {id:id, rel:"stylesheet", type:"text/css", href:url});
  $("head").append(l);
  //Appending to the head doesn't work in good old IE.
  if(document.createStyleSheet){
    document.createStyleSheet(url);
  }
}

//Generic error handler... logs to console and calls an optional callback.
var handleError = function (msg, callback){
  if(window.console){
    console.log("Error loading form:", msg);
  }
  if(callback){
    callback(null); 
  }
};

//Tells you if an url is relative or not.
//so "/foo/bar/foo.bar" is relative
//but //host.name/foo.bar is not.
var isRelativeUrl = function (url){
  return url.indexOf("/") === 0 && url.indexOf("//") !== 0;
}

var ajaxRequest = function(url, success){
  //We used to use CORS for cross domain requests
  //but ran into issues where dumb corporate firewalls 
  //would strip the Access-control-allow-origin headers.  
  //Now we just force JSONP when a request is cross domain.
  var dataType = "json"
  if(!isRelativeUrl(url)){
    dataType = "jsonp";
    url+="&callback=?";  
  }
  $.ajax({
    dataType:dataType,
    url:url,
    success:success,
    error:function (a,b,c){
      handleError(c, success);
    }
  });
}


forms2.loadForm = function (rootUrl,munchkinId,formId,callback){
  forms2.setOptions({
    rootUrl:rootUrl,
    baseUrl:rootUrl + "/js/forms2/"
  });
  var success = function (data){
    getLatestForm = false;
    data.action = (rootUrl.indexOf("http") === 0 ? rootUrl : location.protocol + rootUrl) + opts.formSubmitPath;
    forms2.newForm(data, function (form){
      form.addHiddenFields({
        "munchkinId":munchkinId
      });
      form.render();
      if(callback){
         callback(form);   
      }
    });
  }
  var pageUrl = location.href.split("?")[0].split("#")[0];
  if(pageUrl.length > 255){
    pageUrl = pageUrl.substring(0, 255);
  }
  var url = rootUrl + "/index.php/form/getForm?munchkinId="+munchkinId+"&form="+formId+"&url="+encodeURIComponent(pageUrl);
  ajaxRequest(url, function (data){
    if(data.error){
      handleError(data, callback);    
    }else{
      success(data);
    }
  });
  return forms2;
};

forms2.lightbox = function (form, opts){
  var elem, modal;
  opts = opts || {};
  if(form.getFormElem){
    if(!form.getFormElem()){
      form.render();
    }
    elem =form.getFormElem();
    form.onSuccess(opts.onSuccess || function (values, url){
      modal.hide();
      if(!url){
        return false;
      }
    });
  }else{
    elem = form;
  }
  modal = require("./modal.js")(elem, opts);
  return modal;
};

var defer = function (fn){
  setTimeout(fn, 0);
}

/**
 * Checks to see if the lead is known.  callback will be called either with lead info or null if unknown lead.
 */
var getKnownLead = function (formId, munchkinId, filledFields, callback, lpId){
  if(window.mktoPreFillFields && mktoPreFillFields.FirstName && mktoPreFillFields.LastName){
    defer(function (){
      callback(mktoPreFillFields);
    });
    return;
  }
  var cooks = cookie.parse(document.cookie);
  var params = qs.parse(location.search.replace("?", ""));
  var url = opts.rootUrl + "/index.php/form/getKnownLead?";
  if(cooks._mkto_trk || params.mkt_tok){
    var knownLeadsQs = {
      form:formId,
      lpId:lpId,
      munchkinId:munchkinId,
      filledFields:filledFields
    };
    if(cooks._mkto_trk){
      knownLeadsQs._mkt_trk = cooks._mkto_trk; 
    }
    if(params.mkt_tok){
      knownLeadsQs.mkt_tok = params.mkt_tok;
    }
    url += qs.stringify(knownLeadsQs);
    
    ajaxRequest(url, function (data){
      if(data && data.error){
        handleError(data, callback);
      }else{
        if(window.mktoPreFillFields) {
          data = $.extend({}, window.mktoPrefillFields, data);
        }
        callback(data);
      }
    });
    return; 
  }
  defer(callback);
};

forms2.newForm = function (formData, callback){
  //Load Form Data here
  if (getLatestForm && !formData.isPreview && !formData.isFormTheme) {
    forms2.getLatestFormDescriptor(formData, callback);
  }
  else {
    forms2.processForm(formData,callback);
  }
};

forms2.getLatestFormDescriptor = function(formData,callback) {
  var handleError = function(error) {
    console.log("Error loading form : ", error);
  }
  var success = function (response) {
    if(response.Captcha) {
      formData.Captcha = response.Captcha;
    }
    else {
      delete formData.Captcha;
    }
    return forms2.processForm(formData,callback);
  }

  var ajaxRequest = function(url,success) {
    $.ajax({
      dataType: "json",
      url: url,
      success: success,
      error: function (a, b, c) {
        handleError(c, success);
      }
    });
  }

  var hostname = location.hostname;
  var munchkinId = formData.munchkinId;
  var formId = formData.Id;
  if (munchkinId && formId) {
    var url = hostname + "/index.php/form/getForm?munchkinId=" + munchkinId + "&form=" + formId;
    url = (url.indexOf("http") === 0 ? url : location.protocol + "//" + url);
    ajaxRequest(url, function (data) {
      if (data.error) {
        handleError(data, callback);
      } else {
        success(data);
      }
    });
  }
}

forms2.processForm = function(formData, callback) {
  if($("#mktoForms2BaseStyle").length === 0){
    var href = opts.baseUrl + "css/forms2.css";
    addStyle("mktoForms2BaseStyle", href); 
  }
  if($("#mktoForms2ThemeStyle").length === 0 && formData.ThemeStyle && formData.ThemeStyle.href){
    addStyle("mktoForms2ThemeStyle", opts.baseUrl + formData.ThemeStyle.href);
  }else{
    $("head").append($b("style", "#mktoStyleLoaded {color:#123456;}"));
  }
  if(formData.FontUrl){
    addStyle("mktoFontUrl", formData.FontUrl);
  }
  if(formData.ThemeStyleOverride){
    $("head").append($b("style", formData.ThemeStyleOverride));
  }
  if(!forms2._polyfillsLoaded){
    loadPolyfills(formData);
    forms2._polyfillsLoaded = true;
  }
  var po = formData.ProcessOptions;
  var waitCount = 0;
  
  var isFBTab = function (){
    var l = location;
    return l.hostname.indexOf(opts.fbTabDomain) != -1 && l.search.indexOf("fbTab=1") != -1
  }

  var isDesigner = function (){
    return location.hostname.indexOf(".marketodesigner.com") != -1;
  }

  var waitFn = function (){
    waitCount--;
    if (waitCount <= 0){
      var form = Form(formData, modernizr, opts); 
      forms.push(form);
      if(callback){
        callback(form);
      }
      defer(function (){ 
        if(formData.action && !isFBTab() && !isDesigner()){
          //init the iframe proxy, but only if we're going to use it.
          var submitHost = urlApi.parse(formData.action).hostname;
          if(submitHost && submitHost != location.hostname && modernizr.postmessage && modernizr.json){
            iframeProxy.init('//' + submitHost + opts.formXDPath);
          }  
        } 
      });
      defer(function (){
        emitter.emit('mktoFormReady', form);
      });  
    }
  };

  //We have to fetch the known lead info if progressive profiling is enabled and 
  //If we have a "custom" type knownLead, we'll end up rendering a template instead of a form.
  var hasProfiling = po && po.profiling && po.profiling.isEnabled;
  var isCustomKnowLeadTypeAndHasMunchkin = po && po.knownLead && po.knownLead.type == "custom" && formData.munchkinId;
  if(isCustomKnowLeadTypeAndHasMunchkin || hasProfiling){
    waitCount++;
    getKnownLead(formData.Vid, formData.munchkinId, hasProfiling, function (knownLead){
      if(knownLead) {
        formData.filledFields  = knownLead.filledFields;
        if(knownLead.FirstName && knownLead.LastName){
          formData.knownLead = knownLead;
        }
      }
      waitFn();
    }, formData.lpId);
  }
  
  waitCount++;
  waitForCssLoad(waitFn);
};

forms2.getForm = function(formId){
  for(var i=0; i < forms.length; i++){
    if(""+forms[i].getId() == ""+formId){
      return forms[i];
    }
  }
};

forms2.getPageFields = function (){
  var params = qs.parse(location.search.replace("?", ""));
  var referrerParams = qs.parse(document.referrer.split("?")[0]);
  return {
    cr:params.cr || "",
    kw:params.kw || "",
    q:referrerParams.q || ""
  }
};

forms2.allForms = function (){
  return forms;
};


var callAllForms = function (callback){
  $.each(forms2.allForms(), function (i, form){
    defer(function (){
      callback(form);
    });
  });
};

/** Adds a callback that will be called exactly once for each form on the page that becomes "ready".
  * Readyness means that the form exists, has been initially rendered and had its initial callbacks called.
  * Generally, this will mean that a "ready" form is currently visible to the lead.
  * The callback is passed a single argument, a form object.
  * If there is already a form that is ready at the time this function is called,
  * the passed callback will be called immediately.
  */
forms2.whenReady = function (callback){
  emitter.on("mktoFormReady", callback);
  callAllForms(callback);
  return forms2;
};

/*
 * Adds a callback that will be called every time any form renders.
 * Forms are rendered when initially created, then again every time that
 * visibility rules alter the structure of the form.
 * The callback will be passed a single argument, the form object of the form
 * that was rendered.
 */
forms2.onFormRender = function (callback){
  $("body").on("mktoRender", function (evt, form){
    callback(form);
  });
  return forms2;
};

/**
 * Like onFormRender, this adds a callback that will be called every time a form is rendered.
 * Additionally, this will also call the callback immediately for all forms that have already been rendered.
 * The callback will be passed a single argument, the form object of the form
 * that was rendered.
 */
forms2.whenRendered = function (callback){
  forms2.onFormRender(callback);
  callAllForms(callback);
  return forms2;
};

var loadPolyfills = function (formData){
  //Load polyfills for browsers that need them.
  defer(function (){
    var fields = fh.getFlattenedFields(formData);
    var fieldTypes = fh.getFieldTypes(fields);

    if(!opts.skipPolyfills){
      var baseUrl = opts.baseUrl;
      var load = modernizr.load;
      load({
        test: (modernizr.input.placeholder),
        nope:[baseUrl+"polyfills/placeholder/placeholder.js", baseUrl+"polyfills/placeholder/placeholder.css"]
      });
      load({
        test:fieldTypes.date && !modernizr.inputtypes.date,
        yep:[baseUrl+"polyfills/datepicker/datepicker.js", baseUrl+"polyfills/datepicker/datepicker.css" ]
      });
      load({
        test:fieldTypes.range && !modernizr.inputtypes.range,
        yep:[baseUrl+"polyfills/range/range.js", baseUrl+"polyfills/range/range.css"]
      });
      load({
        test:fieldTypes.textarea && !modernizr.textareamaxlength,
        yep:[baseUrl+"polyfills/maxlength/maxlength.js"]
      });

      var hasMask = fh.anyFieldHasProperty(fields, "FieldMask");
      if(hasMask) {
          var isAndroid = /Android/i.test(navigator.userAgent);
          load({
              test: isAndroid,
              yep: [baseUrl+"polyfills/inputmask/jquery.mask.min.js"],
              nope: [baseUrl+"polyfills/inputmask/inputmask.min.js"]
          });
      }
    }
  });
}
if(typeof window !== 'undefined'){
  window.MktoForms2 = forms2;
}
module.exports = forms2;
},{"./color.js":25,"./fields/fieldhelpers.js":30,"./form.js":42,"./iframeproxy.js":44,"./jquery.js":45,"./modal.js":47,"./modernizr.js":48,"./safelog.js":50,"./shimsham.js":51,"cookie":4,"events":5,"jquery.build":8,"querystring":13,"url":23}],44:[function(require,module,exports){
var $ = require("./jquery.js");
var urlApi = require("url");
var $b = $.build;

var pub = {};

var iframe = null;
var iframeWindow = null; 
var i = 0;
var ready = false;
var frameName = "mktoFormsXDIframe" + Math.random();
var inflight = {}
var q = [];
var iframeUrl;


function normalizeUrl(url){
  if(url.indexOf("//") === 0){
    if(url.match(/^\/\/app-.*?\.marketo\.com/i)){
      return 'https:' + url;
    }
    return location.protocol + url;
  }else if (url.indexOf("/") ===  0){
    return location.protocol + "//" + location.hostname + url;
  }
  return url;
}

pub.init = function (_iframeUrl){
  if(!iframe){
    iframeUrl = normalizeUrl(_iframeUrl);
    $("body").append(iframe = 
      $b("iframe#MktoForms2XDIframe", {
        name:frameName
      }).css({display:"none"})
    );
    iframe.get(0).src = iframeUrl;
    iframeWindow = window.frames[frameName];
    // LM-70403: Forms2 throws "TypeError: iframeWindow is undefined error" on Firefox
    // It seems FireFox on this particular customer website couldn't extract frame window by name.
    // Fall-back solution to retrieve contentWindow of the iframe a different way.
    if (!iframeWindow) {
      iframeWindow = iframe.get(0).contentWindow;
    }
    $(window).on("message", onMessage);
  }
}

function onMessage (e){
  if(e.originalEvent && e.originalEvent.data) {
    // LM-122751: Forms2 iframeproxy may receive XSS message posted by other source
    // To process the message ONLY IF its origin (protocol://host:port) matches iframeurl exactly
    var parsedIframeUrl = urlApi.parse(iframeUrl), parsedOrigin = urlApi.parse(e.originalEvent.origin);
    if (parsedIframeUrl.protocol !== parsedOrigin.protocol || parsedIframeUrl.port !== parsedOrigin.port || parsedIframeUrl.hostname !== parsedOrigin.hostname) {
      return;
    }
    var d;
    try {
      d = $.parseJSON(e.originalEvent.data);
    }catch(ex){
      return;
    }
    if(d.mktoReady){
      onReady();
    }else if(d.mktoResponse){
      onResponse(d.mktoResponse)   
    }
  }
}

function onResponse(mktoResponse){
  var requestId = mktoResponse["for"];
  var request = inflight[requestId];
  if(request){
    if(mktoResponse.error){
      request.error(mktoResponse.data);
    }else{
      request.success(mktoResponse.data);
    }
  }
  delete inflight[requestId];
}

function onReady(){
  ready = true;
  $.each(q, function (i, ajaxParams){
    sendMessage(ajaxParams);
  })
  q = [];
}

function sendMessage(ajaxParams){
  var id = "mktoFormMessage" + (i++);
  inflight[id] = {
    error:ajaxParams.error,
    success:ajaxParams.success
  }
  if(ajaxParams.complete){
    throw new Error("complete parameter not supported");
  }
  ajaxParams.error = null;
  ajaxParams.success = null;
  var urlParsed = urlApi.parse(iframeUrl);

  iframeWindow.postMessage(JSON.stringify({
    mktoRequest:{
      ajaxParams:ajaxParams,
      id:id
    }
  }), urlParsed.protocol + "//"+ urlParsed.hostname);
}

function enqueue(ajaxParams){
  if(ready){
    sendMessage(ajaxParams);
  }else{
    q.push(ajaxParams);
  }
}

pub.send = function (ajaxParams){
  enqueue(ajaxParams);
}

module.exports = pub;


},{"./jquery.js":45,"url":23}],45:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v3.7.1
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2023-08-28T13:37Z
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket trac-14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
	"use strict";

	var arr = [];

	var getProto = Object.getPrototypeOf;

	var slice = arr.slice;

	var flat = arr.flat ? function( array ) {
		return arr.flat.call( array );
	} : function( array ) {
		return arr.concat.apply( [], array );
	};


	var push = arr.push;

	var indexOf = arr.indexOf;

	var class2type = {};

	var toString = class2type.toString;

	var hasOwn = class2type.hasOwnProperty;

	var fnToString = hasOwn.toString;

	var ObjectFunctionString = fnToString.call( Object );

	var support = {};

	var isFunction = function isFunction( obj ) {

		// Support: Chrome <=57, Firefox <=52
		// In some browsers, typeof returns "function" for HTML <object> elements
		// (i.e., `typeof document.createElement( "object" ) === "function"`).
		// We don't want to classify *any* DOM node as a function.
		// Support: QtWeb <=3.8.5, WebKit <=534.34, wkhtmltopdf tool <=0.12.5
		// Plus for old WebKit, typeof returns "function" for HTML collections
		// (e.g., `typeof document.getElementsByTagName("div") === "function"`). (gh-4756)
		return typeof obj === "function" && typeof obj.nodeType !== "number" &&
			typeof obj.item !== "function";
	};


	var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};


	var document = window.document;



	var preservedScriptAttributes = {
		type: true,
		src: true,
		nonce: true,
		noModule: true
	};

	function DOMEval( code, node, doc ) {
		doc = doc || document;

		var i, val,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {

				// Support: Firefox 64+, Edge 18+
				// Some browsers don't support the "nonce" property on scripts.
				// On the other hand, just using `getAttribute` is not enough as
				// the `nonce` attribute is reset to an empty string whenever it
				// becomes browsing-context connected.
				// See https://github.com/whatwg/html/issues/2369
				// See https://html.spec.whatwg.org/#nonce-attributes
				// The `node.getAttribute` check was added for the sake of
				// `jQuery.globalEval` so that it can fake a nonce-containing node
				// via an object.
				val = node[ i ] || node.getAttribute && node.getAttribute( i );
				if ( val ) {
					script.setAttribute( i, val );
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


	function toType( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	}
	/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



	var version = "3.7.1",

		rhtmlSuffix = /HTML$/i,

		// Define a local copy of jQuery
		jQuery = function( selector, context ) {

			// The jQuery object is actually just the init constructor 'enhanced'
			// Need init if jQuery is called (just allow error to be thrown if not included)
			return new jQuery.fn.init( selector, context );
		};

	jQuery.fn = jQuery.prototype = {

		// The current version of jQuery being used
		jquery: version,

		constructor: jQuery,

		// The default length of a jQuery object is 0
		length: 0,

		toArray: function() {
			return slice.call( this );
		},

		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		get: function( num ) {

			// Return all the elements in a clean array
			if ( num == null ) {
				return slice.call( this );
			}

			// Return just the one element from the set
			return num < 0 ? this[ num + this.length ] : this[ num ];
		},

		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		pushStack: function( elems ) {

			// Build a new jQuery matched element set
			var ret = jQuery.merge( this.constructor(), elems );

			// Add the old object onto the stack (as a reference)
			ret.prevObject = this;

			// Return the newly-formed element set
			return ret;
		},

		// Execute a callback for every element in the matched set.
		each: function( callback ) {
			return jQuery.each( this, callback );
		},

		map: function( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			} ) );
		},

		slice: function() {
			return this.pushStack( slice.apply( this, arguments ) );
		},

		first: function() {
			return this.eq( 0 );
		},

		last: function() {
			return this.eq( -1 );
		},

		even: function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return ( i + 1 ) % 2;
			} ) );
		},

		odd: function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return i % 2;
			} ) );
		},

		eq: function( i ) {
			var len = this.length,
				j = +i + ( i < 0 ? len : 0 );
			return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
		},

		end: function() {
			return this.prevObject || this.constructor();
		},

		// For internal use only.
		// Behaves like an Array's method, not like a jQuery method.
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};

	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[ 0 ] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;

			// Skip the boolean and the target
			target = arguments[ i ] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !isFunction( target ) ) {
			target = {};
		}

		// Extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			// Only deal with non-null/undefined values
			if ( ( options = arguments[ i ] ) != null ) {

				// Extend the base object
				for ( name in options ) {
					copy = options[ name ];

					// Prevent Object.prototype pollution
					// Prevent never-ending loop
					if ( name === "__proto__" || target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
						( copyIsArray = Array.isArray( copy ) ) ) ) {
						src = target[ name ];

						// Ensure proper type for the source value
						if ( copyIsArray && !Array.isArray( src ) ) {
							clone = [];
						} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {
							clone = {};
						} else {
							clone = src;
						}
						copyIsArray = false;

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

						// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	jQuery.extend( {

		// Unique for each copy of jQuery on the page
		expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

		// Assume jQuery is ready without the ready module
		isReady: true,

		error: function( msg ) {
			throw new Error( msg );
		},

		noop: function() {},

		isPlainObject: function( obj ) {
			var proto, Ctor;

			// Detect obvious negatives
			// Use toString instead of jQuery.type to catch host objects
			if ( !obj || toString.call( obj ) !== "[object Object]" ) {
				return false;
			}

			proto = getProto( obj );

			// Objects with no prototype (e.g., `Object.create( null )`) are plain
			if ( !proto ) {
				return true;
			}

			// Objects with prototype are plain iff they were constructed by a global Object function
			Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
			return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
		},

		isEmptyObject: function( obj ) {
			var name;

			for ( name in obj ) {
				return false;
			}
			return true;
		},

		// Evaluates a script in a provided context; falls back to the global one
		// if not specified.
		globalEval: function( code, options, doc ) {
			DOMEval( code, { nonce: options && options.nonce }, doc );
		},

		each: function( obj, callback ) {
			var length, i = 0;

			if ( isArrayLike( obj ) ) {
				length = obj.length;
				for ( ; i < length; i++ ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			}

			return obj;
		},


		// Retrieve the text value of an array of DOM nodes
		text: function( elem ) {
			var node,
				ret = "",
				i = 0,
				nodeType = elem.nodeType;

			if ( !nodeType ) {

				// If no nodeType, this is expected to be an array
				while ( ( node = elem[ i++ ] ) ) {

					// Do not traverse comment nodes
					ret += jQuery.text( node );
				}
			}
			if ( nodeType === 1 || nodeType === 11 ) {
				return elem.textContent;
			}
			if ( nodeType === 9 ) {
				return elem.documentElement.textContent;
			}
			if ( nodeType === 3 || nodeType === 4 ) {
				return elem.nodeValue;
			}

			// Do not include comment or processing instruction nodes

			return ret;
		},

		// results is for internal usage only
		makeArray: function( arr, results ) {
			var ret = results || [];

			if ( arr != null ) {
				if ( isArrayLike( Object( arr ) ) ) {
					jQuery.merge( ret,
						typeof arr === "string" ?
							[ arr ] : arr
					);
				} else {
					push.call( ret, arr );
				}
			}

			return ret;
		},

		inArray: function( elem, arr, i ) {
			return arr == null ? -1 : indexOf.call( arr, elem, i );
		},

		isXMLDoc: function( elem ) {
			var namespace = elem && elem.namespaceURI,
				docElem = elem && ( elem.ownerDocument || elem ).documentElement;

			// Assume HTML when documentElement doesn't yet exist, such as inside
			// document fragments.
			return !rhtmlSuffix.test( namespace || docElem && docElem.nodeName || "HTML" );
		},

		// Support: Android <=4.0 only, PhantomJS 1 only
		// push.apply(_, arraylike) throws on ancient WebKit
		merge: function( first, second ) {
			var len = +second.length,
				j = 0,
				i = first.length;

			for ( ; j < len; j++ ) {
				first[ i++ ] = second[ j ];
			}

			first.length = i;

			return first;
		},

		grep: function( elems, callback, invert ) {
			var callbackInverse,
				matches = [],
				i = 0,
				length = elems.length,
				callbackExpect = !invert;

			// Go through the array, only saving the items
			// that pass the validator function
			for ( ; i < length; i++ ) {
				callbackInverse = !callback( elems[ i ], i );
				if ( callbackInverse !== callbackExpect ) {
					matches.push( elems[ i ] );
				}
			}

			return matches;
		},

		// arg is for internal usage only
		map: function( elems, callback, arg ) {
			var length, value,
				i = 0,
				ret = [];

			// Go through the array, translating each of the items to their new values
			if ( isArrayLike( elems ) ) {
				length = elems.length;
				for ( ; i < length; i++ ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}

				// Go through every key on the object,
			} else {
				for ( i in elems ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}
			}

			// Flatten any nested arrays
			return flat( ret );
		},

		// A global GUID counter for objects
		guid: 1,

		// jQuery.support is not used in Core but other projects attach their
		// properties to it so it needs to exist.
		support: support
	} );

	if ( typeof Symbol === "function" ) {
		jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
	}

// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
		function( _i, name ) {
			class2type[ "[object " + name + "]" ] = name.toLowerCase();
		} );

	function isArrayLike( obj ) {

		// Support: real iOS 8.2 only (not reproducible in simulator)
		// `in` check used to prevent JIT error (gh-2145)
		// hasOwn isn't used here due to false negatives
		// regarding Nodelist length in IE
		var length = !!obj && "length" in obj && obj.length,
			type = toType( obj );

		if ( isFunction( obj ) || isWindow( obj ) ) {
			return false;
		}

		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}


	function nodeName( elem, name ) {

		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

	}
	var pop = arr.pop;


	var sort = arr.sort;


	var splice = arr.splice;


	var whitespace = "[\\x20\\t\\r\\n\\f]";


	var rtrimCSS = new RegExp(
		"^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
		"g"
	);




// Note: an element does not contain itself
	jQuery.contains = function( a, b ) {
		var bup = b && b.parentNode;

		return a === bup || !!( bup && bup.nodeType === 1 && (

			// Support: IE 9 - 11+
			// IE doesn't have `contains` on SVG.
			a.contains ?
				a.contains( bup ) :
				a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
		) );
	};




// CSS string/identifier serialization
// https://drafts.csswg.org/cssom/#common-serializing-idioms
	var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

	function fcssescape( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	}

	jQuery.escapeSelector = function( sel ) {
		return ( sel + "" ).replace( rcssescape, fcssescape );
	};




	var preferredDoc = document,
		pushNative = push;

	( function() {

		var i,
			Expr,
			outermostContext,
			sortInput,
			hasDuplicate,
			push = pushNative,

			// Local document vars
			document,
			documentElement,
			documentIsHTML,
			rbuggyQSA,
			matches,

			// Instance-specific data
			expando = jQuery.expando,
			dirruns = 0,
			done = 0,
			classCache = createCache(),
			tokenCache = createCache(),
			compilerCache = createCache(),
			nonnativeSelectorCache = createCache(),
			sortOrder = function( a, b ) {
				if ( a === b ) {
					hasDuplicate = true;
				}
				return 0;
			},

			booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|" +
				"loop|multiple|open|readonly|required|scoped",

			// Regular expressions

			// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
			identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace +
				"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",

			// Attribute selectors: https://www.w3.org/TR/selectors/#attribute-selectors
			attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +

				// Operator (capture 2)
				"*([*^$|!~]?=)" + whitespace +

				// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
				"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" +
				whitespace + "*\\]",

			pseudos = ":(" + identifier + ")(?:\\((" +

				// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
				// 1. quoted (capture 3; capture 4 or capture 5)
				"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

				// 2. simple (capture 6)
				"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

				// 3. anything else (capture 2)
				".*" +
				")\\)|)",

			// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
			rwhitespace = new RegExp( whitespace + "+", "g" ),

			rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
			rleadingCombinator = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" +
				whitespace + "*" ),
			rdescend = new RegExp( whitespace + "|>" ),

			rpseudo = new RegExp( pseudos ),
			ridentifier = new RegExp( "^" + identifier + "$" ),

			matchExpr = {
				ID: new RegExp( "^#(" + identifier + ")" ),
				CLASS: new RegExp( "^\\.(" + identifier + ")" ),
				TAG: new RegExp( "^(" + identifier + "|[*])" ),
				ATTR: new RegExp( "^" + attributes ),
				PSEUDO: new RegExp( "^" + pseudos ),
				CHILD: new RegExp(
					"^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
					whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" +
					whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
				bool: new RegExp( "^(?:" + booleans + ")$", "i" ),

				// For use in libraries implementing .is()
				// We use this for POS matching in `select`
				needsContext: new RegExp( "^" + whitespace +
					"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
					"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
			},

			rinputs = /^(?:input|select|textarea|button)$/i,
			rheader = /^h\d$/i,

			// Easily-parseable/retrievable ID or TAG or CLASS selectors
			rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

			rsibling = /[+~]/,

			// CSS escapes
			// https://www.w3.org/TR/CSS21/syndata.html#escaped-characters
			runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace +
				"?|\\\\([^\\r\\n\\f])", "g" ),
			funescape = function( escape, nonHex ) {
				var high = "0x" + escape.slice( 1 ) - 0x10000;

				if ( nonHex ) {

					// Strip the backslash prefix from a non-hex escape sequence
					return nonHex;
				}

				// Replace a hexadecimal escape sequence with the encoded Unicode code point
				// Support: IE <=11+
				// For values outside the Basic Multilingual Plane (BMP), manually construct a
				// surrogate pair
				return high < 0 ?
					String.fromCharCode( high + 0x10000 ) :
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
			},

			// Used for iframes; see `setDocument`.
			// Support: IE 9 - 11+, Edge 12 - 18+
			// Removing the function wrapper causes a "Permission Denied"
			// error in IE/Edge.
			unloadHandler = function() {
				setDocument();
			},

			inDisabledFieldset = addCombinator(
				function( elem ) {
					return elem.disabled === true && nodeName( elem, "fieldset" );
				},
				{ dir: "parentNode", next: "legend" }
			);

// Support: IE <=9 only
// Accessing document.activeElement can throw unexpectedly
// https://bugs.jquery.com/ticket/13393
		function safeActiveElement() {
			try {
				return document.activeElement;
			} catch ( err ) { }
		}

// Optimize for push.apply( _, NodeList )
		try {
			push.apply(
				( arr = slice.call( preferredDoc.childNodes ) ),
				preferredDoc.childNodes
			);

			// Support: Android <=4.0
			// Detect silently failing push.apply
			// eslint-disable-next-line no-unused-expressions
			arr[ preferredDoc.childNodes.length ].nodeType;
		} catch ( e ) {
			push = {
				apply: function( target, els ) {
					pushNative.apply( target, slice.call( els ) );
				},
				call: function( target ) {
					pushNative.apply( target, slice.call( arguments, 1 ) );
				}
			};
		}

		function find( selector, context, results, seed ) {
			var m, i, elem, nid, match, groups, newSelector,
				newContext = context && context.ownerDocument,

				// nodeType defaults to 9, since context defaults to document
				nodeType = context ? context.nodeType : 9;

			results = results || [];

			// Return early from calls with invalid selector or context
			if ( typeof selector !== "string" || !selector ||
				nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

				return results;
			}

			// Try to shortcut find operations (as opposed to filters) in HTML documents
			if ( !seed ) {
				setDocument( context );
				context = context || document;

				if ( documentIsHTML ) {

					// If the selector is sufficiently simple, try using a "get*By*" DOM method
					// (excepting DocumentFragment context, where the methods don't exist)
					if ( nodeType !== 11 && ( match = rquickExpr.exec( selector ) ) ) {

						// ID selector
						if ( ( m = match[ 1 ] ) ) {

							// Document context
							if ( nodeType === 9 ) {
								if ( ( elem = context.getElementById( m ) ) ) {

									// Support: IE 9 only
									// getElementById can match elements by name instead of ID
									if ( elem.id === m ) {
										push.call( results, elem );
										return results;
									}
								} else {
									return results;
								}

								// Element context
							} else {

								// Support: IE 9 only
								// getElementById can match elements by name instead of ID
								if ( newContext && ( elem = newContext.getElementById( m ) ) &&
									find.contains( context, elem ) &&
									elem.id === m ) {

									push.call( results, elem );
									return results;
								}
							}

							// Type selector
						} else if ( match[ 2 ] ) {
							push.apply( results, context.getElementsByTagName( selector ) );
							return results;

							// Class selector
						} else if ( ( m = match[ 3 ] ) && context.getElementsByClassName ) {
							push.apply( results, context.getElementsByClassName( m ) );
							return results;
						}
					}

					// Take advantage of querySelectorAll
					if ( !nonnativeSelectorCache[ selector + " " ] &&
						( !rbuggyQSA || !rbuggyQSA.test( selector ) ) ) {

						newSelector = selector;
						newContext = context;

						// qSA considers elements outside a scoping root when evaluating child or
						// descendant combinators, which is not what we want.
						// In such cases, we work around the behavior by prefixing every selector in the
						// list with an ID selector referencing the scope context.
						// The technique has to be used as well when a leading combinator is used
						// as such selectors are not recognized by querySelectorAll.
						// Thanks to Andrew Dupont for this technique.
						if ( nodeType === 1 &&
							( rdescend.test( selector ) || rleadingCombinator.test( selector ) ) ) {

							// Expand context for sibling selectors
							newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
								context;

							// We can use :scope instead of the ID hack if the browser
							// supports it & if we're not changing the context.
							// Support: IE 11+, Edge 17 - 18+
							// IE/Edge sometimes throw a "Permission denied" error when
							// strict-comparing two documents; shallow comparisons work.
							// eslint-disable-next-line eqeqeq
							if ( newContext != context || !support.scope ) {

								// Capture the context ID, setting it first if necessary
								if ( ( nid = context.getAttribute( "id" ) ) ) {
									nid = jQuery.escapeSelector( nid );
								} else {
									context.setAttribute( "id", ( nid = expando ) );
								}
							}

							// Prefix every selector in the list
							groups = tokenize( selector );
							i = groups.length;
							while ( i-- ) {
								groups[ i ] = ( nid ? "#" + nid : ":scope" ) + " " +
									toSelector( groups[ i ] );
							}
							newSelector = groups.join( "," );
						}

						try {
							push.apply( results,
								newContext.querySelectorAll( newSelector )
							);
							return results;
						} catch ( qsaError ) {
							nonnativeSelectorCache( selector, true );
						} finally {
							if ( nid === expando ) {
								context.removeAttribute( "id" );
							}
						}
					}
				}
			}

			// All others
			return select( selector.replace( rtrimCSS, "$1" ), context, results, seed );
		}

		/**
		 * Create key-value caches of limited size
		 * @returns {function(string, object)} Returns the Object data after storing it on itself with
		 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
		 *	deleting the oldest entry
		 */
		function createCache() {
			var keys = [];

			function cache( key, value ) {

				// Use (key + " ") to avoid collision with native prototype properties
				// (see https://github.com/jquery/sizzle/issues/157)
				if ( keys.push( key + " " ) > Expr.cacheLength ) {

					// Only keep the most recent entries
					delete cache[ keys.shift() ];
				}
				return ( cache[ key + " " ] = value );
			}
			return cache;
		}

		/**
		 * Mark a function for special use by jQuery selector module
		 * @param {Function} fn The function to mark
		 */
		function markFunction( fn ) {
			fn[ expando ] = true;
			return fn;
		}

		/**
		 * Support testing using an element
		 * @param {Function} fn Passed the created element and returns a boolean result
		 */
		function assert( fn ) {
			var el = document.createElement( "fieldset" );

			try {
				return !!fn( el );
			} catch ( e ) {
				return false;
			} finally {

				// Remove from its parent by default
				if ( el.parentNode ) {
					el.parentNode.removeChild( el );
				}

				// release memory in IE
				el = null;
			}
		}

		/**
		 * Returns a function to use in pseudos for input types
		 * @param {String} type
		 */
		function createInputPseudo( type ) {
			return function( elem ) {
				return nodeName( elem, "input" ) && elem.type === type;
			};
		}

		/**
		 * Returns a function to use in pseudos for buttons
		 * @param {String} type
		 */
		function createButtonPseudo( type ) {
			return function( elem ) {
				return ( nodeName( elem, "input" ) || nodeName( elem, "button" ) ) &&
					elem.type === type;
			};
		}

		/**
		 * Returns a function to use in pseudos for :enabled/:disabled
		 * @param {Boolean} disabled true for :disabled; false for :enabled
		 */
		function createDisabledPseudo( disabled ) {

			// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
			return function( elem ) {

				// Only certain elements can match :enabled or :disabled
				// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
				// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
				if ( "form" in elem ) {

					// Check for inherited disabledness on relevant non-disabled elements:
					// * listed form-associated elements in a disabled fieldset
					//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
					//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
					// * option elements in a disabled optgroup
					//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
					// All such elements have a "form" property.
					if ( elem.parentNode && elem.disabled === false ) {

						// Option elements defer to a parent optgroup if present
						if ( "label" in elem ) {
							if ( "label" in elem.parentNode ) {
								return elem.parentNode.disabled === disabled;
							} else {
								return elem.disabled === disabled;
							}
						}

						// Support: IE 6 - 11+
						// Use the isDisabled shortcut property to check for disabled fieldset ancestors
						return elem.isDisabled === disabled ||

							// Where there is no isDisabled, check manually
							elem.isDisabled !== !disabled &&
							inDisabledFieldset( elem ) === disabled;
					}

					return elem.disabled === disabled;

					// Try to winnow out elements that can't be disabled before trusting the disabled property.
					// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
					// even exist on them, let alone have a boolean value.
				} else if ( "label" in elem ) {
					return elem.disabled === disabled;
				}

				// Remaining elements are neither :enabled nor :disabled
				return false;
			};
		}

		/**
		 * Returns a function to use in pseudos for positionals
		 * @param {Function} fn
		 */
		function createPositionalPseudo( fn ) {
			return markFunction( function( argument ) {
				argument = +argument;
				return markFunction( function( seed, matches ) {
					var j,
						matchIndexes = fn( [], seed.length, argument ),
						i = matchIndexes.length;

					// Match elements found at the specified indexes
					while ( i-- ) {
						if ( seed[ ( j = matchIndexes[ i ] ) ] ) {
							seed[ j ] = !( matches[ j ] = seed[ j ] );
						}
					}
				} );
			} );
		}

		/**
		 * Checks a node for validity as a jQuery selector context
		 * @param {Element|Object=} context
		 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
		 */
		function testContext( context ) {
			return context && typeof context.getElementsByTagName !== "undefined" && context;
		}

		/**
		 * Sets document-related variables once based on the current document
		 * @param {Element|Object} [node] An element or document object to use to set the document
		 * @returns {Object} Returns the current document
		 */
		function setDocument( node ) {
			var subWindow,
				doc = node ? node.ownerDocument || node : preferredDoc;

			// Return early if doc is invalid or already selected
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( doc == document || doc.nodeType !== 9 || !doc.documentElement ) {
				return document;
			}

			// Update global variables
			document = doc;
			documentElement = document.documentElement;
			documentIsHTML = !jQuery.isXMLDoc( document );

			// Support: iOS 7 only, IE 9 - 11+
			// Older browsers didn't support unprefixed `matches`.
			matches = documentElement.matches ||
				documentElement.webkitMatchesSelector ||
				documentElement.msMatchesSelector;

			// Support: IE 9 - 11+, Edge 12 - 18+
			// Accessing iframe documents after unload throws "permission denied" errors
			// (see trac-13936).
			// Limit the fix to IE & Edge Legacy; despite Edge 15+ implementing `matches`,
			// all IE 9+ and Edge Legacy versions implement `msMatchesSelector` as well.
			if ( documentElement.msMatchesSelector &&

				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				preferredDoc != document &&
				( subWindow = document.defaultView ) && subWindow.top !== subWindow ) {

				// Support: IE 9 - 11+, Edge 12 - 18+
				subWindow.addEventListener( "unload", unloadHandler );
			}

			// Support: IE <10
			// Check if getElementById returns elements by name
			// The broken getElementById methods don't pick up programmatically-set names,
			// so use a roundabout getElementsByName test
			support.getById = assert( function( el ) {
				documentElement.appendChild( el ).id = jQuery.expando;
				return !document.getElementsByName ||
					!document.getElementsByName( jQuery.expando ).length;
			} );

			// Support: IE 9 only
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node.
			support.disconnectedMatch = assert( function( el ) {
				return matches.call( el, "*" );
			} );

			// Support: IE 9 - 11+, Edge 12 - 18+
			// IE/Edge don't support the :scope pseudo-class.
			support.scope = assert( function() {
				return document.querySelectorAll( ":scope" );
			} );

			// Support: Chrome 105 - 111 only, Safari 15.4 - 16.3 only
			// Make sure the `:has()` argument is parsed unforgivingly.
			// We include `*` in the test to detect buggy implementations that are
			// _selectively_ forgiving (specifically when the list includes at least
			// one valid selector).
			// Note that we treat complete lack of support for `:has()` as if it were
			// spec-compliant support, which is fine because use of `:has()` in such
			// environments will fail in the qSA path and fall back to jQuery traversal
			// anyway.
			support.cssHas = assert( function() {
				try {
					document.querySelector( ":has(*,:jqfake)" );
					return false;
				} catch ( e ) {
					return true;
				}
			} );

			// ID filter and find
			if ( support.getById ) {
				Expr.filter.ID = function( id ) {
					var attrId = id.replace( runescape, funescape );
					return function( elem ) {
						return elem.getAttribute( "id" ) === attrId;
					};
				};
				Expr.find.ID = function( id, context ) {
					if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
						var elem = context.getElementById( id );
						return elem ? [ elem ] : [];
					}
				};
			} else {
				Expr.filter.ID =  function( id ) {
					var attrId = id.replace( runescape, funescape );
					return function( elem ) {
						var node = typeof elem.getAttributeNode !== "undefined" &&
							elem.getAttributeNode( "id" );
						return node && node.value === attrId;
					};
				};

				// Support: IE 6 - 7 only
				// getElementById is not reliable as a find shortcut
				Expr.find.ID = function( id, context ) {
					if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
						var node, i, elems,
							elem = context.getElementById( id );

						if ( elem ) {

							// Verify the id attribute
							node = elem.getAttributeNode( "id" );
							if ( node && node.value === id ) {
								return [ elem ];
							}

							// Fall back on getElementsByName
							elems = context.getElementsByName( id );
							i = 0;
							while ( ( elem = elems[ i++ ] ) ) {
								node = elem.getAttributeNode( "id" );
								if ( node && node.value === id ) {
									return [ elem ];
								}
							}
						}

						return [];
					}
				};
			}

			// Tag
			Expr.find.TAG = function( tag, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( tag );

					// DocumentFragment nodes don't have gEBTN
				} else {
					return context.querySelectorAll( tag );
				}
			};

			// Class
			Expr.find.CLASS = function( className, context ) {
				if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
					return context.getElementsByClassName( className );
				}
			};

			/* QSA/matchesSelector
	---------------------------------------------------------------------- */

			// QSA and matchesSelector support

			rbuggyQSA = [];

			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert( function( el ) {

				var input;

				documentElement.appendChild( el ).innerHTML =
					"<a id='" + expando + "' href='' disabled='disabled'></a>" +
					"<select id='" + expando + "-\r\\' disabled='disabled'>" +
					"<option selected=''></option></select>";

				// Support: iOS <=7 - 8 only
				// Boolean attributes and "value" are not treated correctly in some XML documents
				if ( !el.querySelectorAll( "[selected]" ).length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}

				// Support: iOS <=7 - 8 only
				if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
					rbuggyQSA.push( "~=" );
				}

				// Support: iOS 8 only
				// https://bugs.webkit.org/show_bug.cgi?id=136851
				// In-page `selector#id sibling-combinator selector` fails
				if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
					rbuggyQSA.push( ".#.+[+~]" );
				}

				// Support: Chrome <=105+, Firefox <=104+, Safari <=15.4+
				// In some of the document kinds, these selectors wouldn't work natively.
				// This is probably OK but for backwards compatibility we want to maintain
				// handling them through jQuery traversal in jQuery 3.x.
				if ( !el.querySelectorAll( ":checked" ).length ) {
					rbuggyQSA.push( ":checked" );
				}

				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				input = document.createElement( "input" );
				input.setAttribute( "type", "hidden" );
				el.appendChild( input ).setAttribute( "name", "D" );

				// Support: IE 9 - 11+
				// IE's :disabled selector does not pick up the children of disabled fieldsets
				// Support: Chrome <=105+, Firefox <=104+, Safari <=15.4+
				// In some of the document kinds, these selectors wouldn't work natively.
				// This is probably OK but for backwards compatibility we want to maintain
				// handling them through jQuery traversal in jQuery 3.x.
				documentElement.appendChild( el ).disabled = true;
				if ( el.querySelectorAll( ":disabled" ).length !== 2 ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Support: IE 11+, Edge 15 - 18+
				// IE 11/Edge don't find elements on a `[name='']` query in some cases.
				// Adding a temporary attribute to the document before the selection works
				// around the issue.
				// Interestingly, IE 10 & older don't seem to have the issue.
				input = document.createElement( "input" );
				input.setAttribute( "name", "" );
				el.appendChild( input );
				if ( !el.querySelectorAll( "[name='']" ).length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*name" + whitespace + "*=" +
						whitespace + "*(?:''|\"\")" );
				}
			} );

			if ( !support.cssHas ) {

				// Support: Chrome 105 - 110+, Safari 15.4 - 16.3+
				// Our regular `try-catch` mechanism fails to detect natively-unsupported
				// pseudo-classes inside `:has()` (such as `:has(:contains("Foo"))`)
				// in browsers that parse the `:has()` argument as a forgiving selector list.
				// https://drafts.csswg.org/selectors/#relational now requires the argument
				// to be parsed unforgivingly, but browsers have not yet fully adjusted.
				rbuggyQSA.push( ":has" );
			}

			rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );

			/* Sorting
	---------------------------------------------------------------------- */

			// Document order sorting
			sortOrder = function( a, b ) {

				// Flag for duplicate removal
				if ( a === b ) {
					hasDuplicate = true;
					return 0;
				}

				// Sort on method existence if only one input has compareDocumentPosition
				var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
				if ( compare ) {
					return compare;
				}

				// Calculate position if both inputs belong to the same document
				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
					a.compareDocumentPosition( b ) :

					// Otherwise we know they are disconnected
					1;

				// Disconnected nodes
				if ( compare & 1 ||
					( !support.sortDetached && b.compareDocumentPosition( a ) === compare ) ) {

					// Choose the first element that is related to our preferred document
					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					if ( a === document || a.ownerDocument == preferredDoc &&
						find.contains( preferredDoc, a ) ) {
						return -1;
					}

					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					if ( b === document || b.ownerDocument == preferredDoc &&
						find.contains( preferredDoc, b ) ) {
						return 1;
					}

					// Maintain original order
					return sortInput ?
						( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
						0;
				}

				return compare & 4 ? -1 : 1;
			};

			return document;
		}

		find.matches = function( expr, elements ) {
			return find( expr, null, null, elements );
		};

		find.matchesSelector = function( elem, expr ) {
			setDocument( elem );

			if ( documentIsHTML &&
				!nonnativeSelectorCache[ expr + " " ] &&
				( !rbuggyQSA || !rbuggyQSA.test( expr ) ) ) {

				try {
					var ret = matches.call( elem, expr );

					// IE 9's matchesSelector returns false on disconnected nodes
					if ( ret || support.disconnectedMatch ||

						// As well, disconnected nodes are said to be in a document
						// fragment in IE 9
						elem.document && elem.document.nodeType !== 11 ) {
						return ret;
					}
				} catch ( e ) {
					nonnativeSelectorCache( expr, true );
				}
			}

			return find( expr, document, null, [ elem ] ).length > 0;
		};

		find.contains = function( context, elem ) {

			// Set document vars if needed
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( ( context.ownerDocument || context ) != document ) {
				setDocument( context );
			}
			return jQuery.contains( context, elem );
		};


		find.attr = function( elem, name ) {

			// Set document vars if needed
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( ( elem.ownerDocument || elem ) != document ) {
				setDocument( elem );
			}

			var fn = Expr.attrHandle[ name.toLowerCase() ],

				// Don't get fooled by Object.prototype properties (see trac-13807)
				val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
					fn( elem, name, !documentIsHTML ) :
					undefined;

			if ( val !== undefined ) {
				return val;
			}

			return elem.getAttribute( name );
		};

		find.error = function( msg ) {
			throw new Error( "Syntax error, unrecognized expression: " + msg );
		};

		/**
		 * Document sorting and removing duplicates
		 * @param {ArrayLike} results
		 */
		jQuery.uniqueSort = function( results ) {
			var elem,
				duplicates = [],
				j = 0,
				i = 0;

			// Unless we *know* we can detect duplicates, assume their presence
			//
			// Support: Android <=4.0+
			// Testing for detecting duplicates is unpredictable so instead assume we can't
			// depend on duplicate detection in all browsers without a stable sort.
			hasDuplicate = !support.sortStable;
			sortInput = !support.sortStable && slice.call( results, 0 );
			sort.call( results, sortOrder );

			if ( hasDuplicate ) {
				while ( ( elem = results[ i++ ] ) ) {
					if ( elem === results[ i ] ) {
						j = duplicates.push( i );
					}
				}
				while ( j-- ) {
					splice.call( results, duplicates[ j ], 1 );
				}
			}

			// Clear input after sorting to release objects
			// See https://github.com/jquery/sizzle/pull/225
			sortInput = null;

			return results;
		};

		jQuery.fn.uniqueSort = function() {
			return this.pushStack( jQuery.uniqueSort( slice.apply( this ) ) );
		};

		Expr = jQuery.expr = {

			// Can be adjusted by the user
			cacheLength: 50,

			createPseudo: markFunction,

			match: matchExpr,

			attrHandle: {},

			find: {},

			relative: {
				">": { dir: "parentNode", first: true },
				" ": { dir: "parentNode" },
				"+": { dir: "previousSibling", first: true },
				"~": { dir: "previousSibling" }
			},

			preFilter: {
				ATTR: function( match ) {
					match[ 1 ] = match[ 1 ].replace( runescape, funescape );

					// Move the given value to match[3] whether quoted or unquoted
					match[ 3 ] = ( match[ 3 ] || match[ 4 ] || match[ 5 ] || "" )
						.replace( runescape, funescape );

					if ( match[ 2 ] === "~=" ) {
						match[ 3 ] = " " + match[ 3 ] + " ";
					}

					return match.slice( 0, 4 );
				},

				CHILD: function( match ) {

					/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
					match[ 1 ] = match[ 1 ].toLowerCase();

					if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {

						// nth-* requires argument
						if ( !match[ 3 ] ) {
							find.error( match[ 0 ] );
						}

						// numeric x and y parameters for Expr.filter.CHILD
						// remember that false/true cast respectively to 0/1
						match[ 4 ] = +( match[ 4 ] ?
								match[ 5 ] + ( match[ 6 ] || 1 ) :
								2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" )
						);
						match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

						// other types prohibit arguments
					} else if ( match[ 3 ] ) {
						find.error( match[ 0 ] );
					}

					return match;
				},

				PSEUDO: function( match ) {
					var excess,
						unquoted = !match[ 6 ] && match[ 2 ];

					if ( matchExpr.CHILD.test( match[ 0 ] ) ) {
						return null;
					}

					// Accept quoted arguments as-is
					if ( match[ 3 ] ) {
						match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

						// Strip excess characters from unquoted arguments
					} else if ( unquoted && rpseudo.test( unquoted ) &&

						// Get excess from tokenize (recursively)
						( excess = tokenize( unquoted, true ) ) &&

						// advance to the next closing parenthesis
						( excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length ) ) {

						// excess is a negative index
						match[ 0 ] = match[ 0 ].slice( 0, excess );
						match[ 2 ] = unquoted.slice( 0, excess );
					}

					// Return only captures needed by the pseudo filter method (type and argument)
					return match.slice( 0, 3 );
				}
			},

			filter: {

				TAG: function( nodeNameSelector ) {
					var expectedNodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
					return nodeNameSelector === "*" ?
						function() {
							return true;
						} :
						function( elem ) {
							return nodeName( elem, expectedNodeName );
						};
				},

				CLASS: function( className ) {
					var pattern = classCache[ className + " " ];

					return pattern ||
						( pattern = new RegExp( "(^|" + whitespace + ")" + className +
							"(" + whitespace + "|$)" ) ) &&
						classCache( className, function( elem ) {
							return pattern.test(
								typeof elem.className === "string" && elem.className ||
								typeof elem.getAttribute !== "undefined" &&
								elem.getAttribute( "class" ) ||
								""
							);
						} );
				},

				ATTR: function( name, operator, check ) {
					return function( elem ) {
						var result = find.attr( elem, name );

						if ( result == null ) {
							return operator === "!=";
						}
						if ( !operator ) {
							return true;
						}

						result += "";

						if ( operator === "=" ) {
							return result === check;
						}
						if ( operator === "!=" ) {
							return result !== check;
						}
						if ( operator === "^=" ) {
							return check && result.indexOf( check ) === 0;
						}
						if ( operator === "*=" ) {
							return check && result.indexOf( check ) > -1;
						}
						if ( operator === "$=" ) {
							return check && result.slice( -check.length ) === check;
						}
						if ( operator === "~=" ) {
							return ( " " + result.replace( rwhitespace, " " ) + " " )
								.indexOf( check ) > -1;
						}
						if ( operator === "|=" ) {
							return result === check || result.slice( 0, check.length + 1 ) === check + "-";
						}

						return false;
					};
				},

				CHILD: function( type, what, _argument, first, last ) {
					var simple = type.slice( 0, 3 ) !== "nth",
						forward = type.slice( -4 ) !== "last",
						ofType = what === "of-type";

					return first === 1 && last === 0 ?

						// Shortcut for :nth-*(n)
						function( elem ) {
							return !!elem.parentNode;
						} :

						function( elem, _context, xml ) {
							var cache, outerCache, node, nodeIndex, start,
								dir = simple !== forward ? "nextSibling" : "previousSibling",
								parent = elem.parentNode,
								name = ofType && elem.nodeName.toLowerCase(),
								useCache = !xml && !ofType,
								diff = false;

							if ( parent ) {

								// :(first|last|only)-(child|of-type)
								if ( simple ) {
									while ( dir ) {
										node = elem;
										while ( ( node = node[ dir ] ) ) {
											if ( ofType ?
												nodeName( node, name ) :
												node.nodeType === 1 ) {

												return false;
											}
										}

										// Reverse direction for :only-* (if we haven't yet done so)
										start = dir = type === "only" && !start && "nextSibling";
									}
									return true;
								}

								start = [ forward ? parent.firstChild : parent.lastChild ];

								// non-xml :nth-child(...) stores cache data on `parent`
								if ( forward && useCache ) {

									// Seek `elem` from a previously-cached index
									outerCache = parent[ expando ] || ( parent[ expando ] = {} );
									cache = outerCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex && cache[ 2 ];
									node = nodeIndex && parent.childNodes[ nodeIndex ];

									while ( ( node = ++nodeIndex && node && node[ dir ] ||

										// Fallback to seeking `elem` from the start
										( diff = nodeIndex = 0 ) || start.pop() ) ) {

										// When found, cache indexes on `parent` and break
										if ( node.nodeType === 1 && ++diff && node === elem ) {
											outerCache[ type ] = [ dirruns, nodeIndex, diff ];
											break;
										}
									}

								} else {

									// Use previously-cached element index if available
									if ( useCache ) {
										outerCache = elem[ expando ] || ( elem[ expando ] = {} );
										cache = outerCache[ type ] || [];
										nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
										diff = nodeIndex;
									}

									// xml :nth-child(...)
									// or :nth-last-child(...) or :nth(-last)?-of-type(...)
									if ( diff === false ) {

										// Use the same loop as above to seek `elem` from the start
										while ( ( node = ++nodeIndex && node && node[ dir ] ||
											( diff = nodeIndex = 0 ) || start.pop() ) ) {

											if ( ( ofType ?
													nodeName( node, name ) :
													node.nodeType === 1 ) &&
												++diff ) {

												// Cache the index of each encountered element
												if ( useCache ) {
													outerCache = node[ expando ] ||
														( node[ expando ] = {} );
													outerCache[ type ] = [ dirruns, diff ];
												}

												if ( node === elem ) {
													break;
												}
											}
										}
									}
								}

								// Incorporate the offset, then check against cycle size
								diff -= last;
								return diff === first || ( diff % first === 0 && diff / first >= 0 );
							}
						};
				},

				PSEUDO: function( pseudo, argument ) {

					// pseudo-class names are case-insensitive
					// https://www.w3.org/TR/selectors/#pseudo-classes
					// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
					// Remember that setFilters inherits from pseudos
					var args,
						fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
							find.error( "unsupported pseudo: " + pseudo );

					// The user may use createPseudo to indicate that
					// arguments are needed to create the filter function
					// just as jQuery does
					if ( fn[ expando ] ) {
						return fn( argument );
					}

					// But maintain support for old signatures
					if ( fn.length > 1 ) {
						args = [ pseudo, pseudo, "", argument ];
						return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
							markFunction( function( seed, matches ) {
								var idx,
									matched = fn( seed, argument ),
									i = matched.length;
								while ( i-- ) {
									idx = indexOf.call( seed, matched[ i ] );
									seed[ idx ] = !( matches[ idx ] = matched[ i ] );
								}
							} ) :
							function( elem ) {
								return fn( elem, 0, args );
							};
					}

					return fn;
				}
			},

			pseudos: {

				// Potentially complex pseudos
				not: markFunction( function( selector ) {

					// Trim the selector passed to compile
					// to avoid treating leading and trailing
					// spaces as combinators
					var input = [],
						results = [],
						matcher = compile( selector.replace( rtrimCSS, "$1" ) );

					return matcher[ expando ] ?
						markFunction( function( seed, matches, _context, xml ) {
							var elem,
								unmatched = matcher( seed, null, xml, [] ),
								i = seed.length;

							// Match elements unmatched by `matcher`
							while ( i-- ) {
								if ( ( elem = unmatched[ i ] ) ) {
									seed[ i ] = !( matches[ i ] = elem );
								}
							}
						} ) :
						function( elem, _context, xml ) {
							input[ 0 ] = elem;
							matcher( input, null, xml, results );

							// Don't keep the element
							// (see https://github.com/jquery/sizzle/issues/299)
							input[ 0 ] = null;
							return !results.pop();
						};
				} ),

				has: markFunction( function( selector ) {
					return function( elem ) {
						return find( selector, elem ).length > 0;
					};
				} ),

				contains: markFunction( function( text ) {
					text = text.replace( runescape, funescape );
					return function( elem ) {
						return ( elem.textContent || jQuery.text( elem ) ).indexOf( text ) > -1;
					};
				} ),

				// "Whether an element is represented by a :lang() selector
				// is based solely on the element's language value
				// being equal to the identifier C,
				// or beginning with the identifier C immediately followed by "-".
				// The matching of C against the element's language value is performed case-insensitively.
				// The identifier C does not have to be a valid language name."
				// https://www.w3.org/TR/selectors/#lang-pseudo
				lang: markFunction( function( lang ) {

					// lang value must be a valid identifier
					if ( !ridentifier.test( lang || "" ) ) {
						find.error( "unsupported lang: " + lang );
					}
					lang = lang.replace( runescape, funescape ).toLowerCase();
					return function( elem ) {
						var elemLang;
						do {
							if ( ( elemLang = documentIsHTML ?
								elem.lang :
								elem.getAttribute( "xml:lang" ) || elem.getAttribute( "lang" ) ) ) {

								elemLang = elemLang.toLowerCase();
								return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
							}
						} while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );
						return false;
					};
				} ),

				// Miscellaneous
				target: function( elem ) {
					var hash = window.location && window.location.hash;
					return hash && hash.slice( 1 ) === elem.id;
				},

				root: function( elem ) {
					return elem === documentElement;
				},

				focus: function( elem ) {
					return elem === safeActiveElement() &&
						document.hasFocus() &&
						!!( elem.type || elem.href || ~elem.tabIndex );
				},

				// Boolean properties
				enabled: createDisabledPseudo( false ),
				disabled: createDisabledPseudo( true ),

				checked: function( elem ) {

					// In CSS3, :checked should return both checked and selected elements
					// https://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
					return ( nodeName( elem, "input" ) && !!elem.checked ) ||
						( nodeName( elem, "option" ) && !!elem.selected );
				},

				selected: function( elem ) {

					// Support: IE <=11+
					// Accessing the selectedIndex property
					// forces the browser to treat the default option as
					// selected when in an optgroup.
					if ( elem.parentNode ) {
						// eslint-disable-next-line no-unused-expressions
						elem.parentNode.selectedIndex;
					}

					return elem.selected === true;
				},

				// Contents
				empty: function( elem ) {

					// https://www.w3.org/TR/selectors/#empty-pseudo
					// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
					//   but not by others (comment: 8; processing instruction: 7; etc.)
					// nodeType < 6 works because attributes (2) do not appear as children
					for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
						if ( elem.nodeType < 6 ) {
							return false;
						}
					}
					return true;
				},

				parent: function( elem ) {
					return !Expr.pseudos.empty( elem );
				},

				// Element/input types
				header: function( elem ) {
					return rheader.test( elem.nodeName );
				},

				input: function( elem ) {
					return rinputs.test( elem.nodeName );
				},

				button: function( elem ) {
					return nodeName( elem, "input" ) && elem.type === "button" ||
						nodeName( elem, "button" );
				},

				text: function( elem ) {
					var attr;
					return nodeName( elem, "input" ) && elem.type === "text" &&

						// Support: IE <10 only
						// New HTML5 attribute values (e.g., "search") appear
						// with elem.type === "text"
						( ( attr = elem.getAttribute( "type" ) ) == null ||
							attr.toLowerCase() === "text" );
				},

				// Position-in-collection
				first: createPositionalPseudo( function() {
					return [ 0 ];
				} ),

				last: createPositionalPseudo( function( _matchIndexes, length ) {
					return [ length - 1 ];
				} ),

				eq: createPositionalPseudo( function( _matchIndexes, length, argument ) {
					return [ argument < 0 ? argument + length : argument ];
				} ),

				even: createPositionalPseudo( function( matchIndexes, length ) {
					var i = 0;
					for ( ; i < length; i += 2 ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				} ),

				odd: createPositionalPseudo( function( matchIndexes, length ) {
					var i = 1;
					for ( ; i < length; i += 2 ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				} ),

				lt: createPositionalPseudo( function( matchIndexes, length, argument ) {
					var i;

					if ( argument < 0 ) {
						i = argument + length;
					} else if ( argument > length ) {
						i = length;
					} else {
						i = argument;
					}

					for ( ; --i >= 0; ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				} ),

				gt: createPositionalPseudo( function( matchIndexes, length, argument ) {
					var i = argument < 0 ? argument + length : argument;
					for ( ; ++i < length; ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				} )
			}
		};

		Expr.pseudos.nth = Expr.pseudos.eq;

// Add button/input type pseudos
		for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
			Expr.pseudos[ i ] = createInputPseudo( i );
		}
		for ( i in { submit: true, reset: true } ) {
			Expr.pseudos[ i ] = createButtonPseudo( i );
		}

// Easy API for creating new setFilters
		function setFilters() {}
		setFilters.prototype = Expr.filters = Expr.pseudos;
		Expr.setFilters = new setFilters();

		function tokenize( selector, parseOnly ) {
			var matched, match, tokens, type,
				soFar, groups, preFilters,
				cached = tokenCache[ selector + " " ];

			if ( cached ) {
				return parseOnly ? 0 : cached.slice( 0 );
			}

			soFar = selector;
			groups = [];
			preFilters = Expr.preFilter;

			while ( soFar ) {

				// Comma and first run
				if ( !matched || ( match = rcomma.exec( soFar ) ) ) {
					if ( match ) {

						// Don't consume trailing commas as valid
						soFar = soFar.slice( match[ 0 ].length ) || soFar;
					}
					groups.push( ( tokens = [] ) );
				}

				matched = false;

				// Combinators
				if ( ( match = rleadingCombinator.exec( soFar ) ) ) {
					matched = match.shift();
					tokens.push( {
						value: matched,

						// Cast descendant combinators to space
						type: match[ 0 ].replace( rtrimCSS, " " )
					} );
					soFar = soFar.slice( matched.length );
				}

				// Filters
				for ( type in Expr.filter ) {
					if ( ( match = matchExpr[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
						( match = preFilters[ type ]( match ) ) ) ) {
						matched = match.shift();
						tokens.push( {
							value: matched,
							type: type,
							matches: match
						} );
						soFar = soFar.slice( matched.length );
					}
				}

				if ( !matched ) {
					break;
				}
			}

			// Return the length of the invalid excess
			// if we're just parsing
			// Otherwise, throw an error or return tokens
			if ( parseOnly ) {
				return soFar.length;
			}

			return soFar ?
				find.error( selector ) :

				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
		}

		function toSelector( tokens ) {
			var i = 0,
				len = tokens.length,
				selector = "";
			for ( ; i < len; i++ ) {
				selector += tokens[ i ].value;
			}
			return selector;
		}

		function addCombinator( matcher, combinator, base ) {
			var dir = combinator.dir,
				skip = combinator.next,
				key = skip || dir,
				checkNonElements = base && key === "parentNode",
				doneName = done++;

			return combinator.first ?

				// Check against closest ancestor/preceding element
				function( elem, context, xml ) {
					while ( ( elem = elem[ dir ] ) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							return matcher( elem, context, xml );
						}
					}
					return false;
				} :

				// Check against all ancestor/preceding elements
				function( elem, context, xml ) {
					var oldCache, outerCache,
						newCache = [ dirruns, doneName ];

					// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
					if ( xml ) {
						while ( ( elem = elem[ dir ] ) ) {
							if ( elem.nodeType === 1 || checkNonElements ) {
								if ( matcher( elem, context, xml ) ) {
									return true;
								}
							}
						}
					} else {
						while ( ( elem = elem[ dir ] ) ) {
							if ( elem.nodeType === 1 || checkNonElements ) {
								outerCache = elem[ expando ] || ( elem[ expando ] = {} );

								if ( skip && nodeName( elem, skip ) ) {
									elem = elem[ dir ] || elem;
								} else if ( ( oldCache = outerCache[ key ] ) &&
									oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

									// Assign to newCache so results back-propagate to previous elements
									return ( newCache[ 2 ] = oldCache[ 2 ] );
								} else {

									// Reuse newcache so results back-propagate to previous elements
									outerCache[ key ] = newCache;

									// A match means we're done; a fail means we have to keep checking
									if ( ( newCache[ 2 ] = matcher( elem, context, xml ) ) ) {
										return true;
									}
								}
							}
						}
					}
					return false;
				};
		}

		function elementMatcher( matchers ) {
			return matchers.length > 1 ?
				function( elem, context, xml ) {
					var i = matchers.length;
					while ( i-- ) {
						if ( !matchers[ i ]( elem, context, xml ) ) {
							return false;
						}
					}
					return true;
				} :
				matchers[ 0 ];
		}

		function multipleContexts( selector, contexts, results ) {
			var i = 0,
				len = contexts.length;
			for ( ; i < len; i++ ) {
				find( selector, contexts[ i ], results );
			}
			return results;
		}

		function condense( unmatched, map, filter, context, xml ) {
			var elem,
				newUnmatched = [],
				i = 0,
				len = unmatched.length,
				mapped = map != null;

			for ( ; i < len; i++ ) {
				if ( ( elem = unmatched[ i ] ) ) {
					if ( !filter || filter( elem, context, xml ) ) {
						newUnmatched.push( elem );
						if ( mapped ) {
							map.push( i );
						}
					}
				}
			}

			return newUnmatched;
		}

		function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
			if ( postFilter && !postFilter[ expando ] ) {
				postFilter = setMatcher( postFilter );
			}
			if ( postFinder && !postFinder[ expando ] ) {
				postFinder = setMatcher( postFinder, postSelector );
			}
			return markFunction( function( seed, results, context, xml ) {
				var temp, i, elem, matcherOut,
					preMap = [],
					postMap = [],
					preexisting = results.length,

					// Get initial elements from seed or context
					elems = seed ||
						multipleContexts( selector || "*",
							context.nodeType ? [ context ] : context, [] ),

					// Prefilter to get matcher input, preserving a map for seed-results synchronization
					matcherIn = preFilter && ( seed || !selector ) ?
						condense( elems, preMap, preFilter, context, xml ) :
						elems;

				if ( matcher ) {

					// If we have a postFinder, or filtered seed, or non-seed postFilter
					// or preexisting results,
					matcherOut = postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results;

					// Find primary matches
					matcher( matcherIn, matcherOut, context, xml );
				} else {
					matcherOut = matcherIn;
				}

				// Apply postFilter
				if ( postFilter ) {
					temp = condense( matcherOut, postMap );
					postFilter( temp, [], context, xml );

					// Un-match failing elements by moving them back to matcherIn
					i = temp.length;
					while ( i-- ) {
						if ( ( elem = temp[ i ] ) ) {
							matcherOut[ postMap[ i ] ] = !( matcherIn[ postMap[ i ] ] = elem );
						}
					}
				}

				if ( seed ) {
					if ( postFinder || preFilter ) {
						if ( postFinder ) {

							// Get the final matcherOut by condensing this intermediate into postFinder contexts
							temp = [];
							i = matcherOut.length;
							while ( i-- ) {
								if ( ( elem = matcherOut[ i ] ) ) {

									// Restore matcherIn since elem is not yet a final match
									temp.push( ( matcherIn[ i ] = elem ) );
								}
							}
							postFinder( null, ( matcherOut = [] ), temp, xml );
						}

						// Move matched elements from seed to results to keep them synchronized
						i = matcherOut.length;
						while ( i-- ) {
							if ( ( elem = matcherOut[ i ] ) &&
								( temp = postFinder ? indexOf.call( seed, elem ) : preMap[ i ] ) > -1 ) {

								seed[ temp ] = !( results[ temp ] = elem );
							}
						}
					}

					// Add elements to results, through postFinder if defined
				} else {
					matcherOut = condense(
						matcherOut === results ?
							matcherOut.splice( preexisting, matcherOut.length ) :
							matcherOut
					);
					if ( postFinder ) {
						postFinder( null, results, matcherOut, xml );
					} else {
						push.apply( results, matcherOut );
					}
				}
			} );
		}

		function matcherFromTokens( tokens ) {
			var checkContext, matcher, j,
				len = tokens.length,
				leadingRelative = Expr.relative[ tokens[ 0 ].type ],
				implicitRelative = leadingRelative || Expr.relative[ " " ],
				i = leadingRelative ? 1 : 0,

				// The foundational matcher ensures that elements are reachable from top-level context(s)
				matchContext = addCombinator( function( elem ) {
					return elem === checkContext;
				}, implicitRelative, true ),
				matchAnyContext = addCombinator( function( elem ) {
					return indexOf.call( checkContext, elem ) > -1;
				}, implicitRelative, true ),
				matchers = [ function( elem, context, xml ) {

					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					var ret = ( !leadingRelative && ( xml || context != outermostContext ) ) || (
						( checkContext = context ).nodeType ?
							matchContext( elem, context, xml ) :
							matchAnyContext( elem, context, xml ) );

					// Avoid hanging onto element
					// (see https://github.com/jquery/sizzle/issues/299)
					checkContext = null;
					return ret;
				} ];

			for ( ; i < len; i++ ) {
				if ( ( matcher = Expr.relative[ tokens[ i ].type ] ) ) {
					matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
				} else {
					matcher = Expr.filter[ tokens[ i ].type ].apply( null, tokens[ i ].matches );

					// Return special upon seeing a positional matcher
					if ( matcher[ expando ] ) {

						// Find the next relative operator (if any) for proper handling
						j = ++i;
						for ( ; j < len; j++ ) {
							if ( Expr.relative[ tokens[ j ].type ] ) {
								break;
							}
						}
						return setMatcher(
							i > 1 && elementMatcher( matchers ),
							i > 1 && toSelector(

								// If the preceding token was a descendant combinator, insert an implicit any-element `*`
								tokens.slice( 0, i - 1 )
									.concat( { value: tokens[ i - 2 ].type === " " ? "*" : "" } )
							).replace( rtrimCSS, "$1" ),
							matcher,
							i < j && matcherFromTokens( tokens.slice( i, j ) ),
							j < len && matcherFromTokens( ( tokens = tokens.slice( j ) ) ),
							j < len && toSelector( tokens )
						);
					}
					matchers.push( matcher );
				}
			}

			return elementMatcher( matchers );
		}

		function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
			var bySet = setMatchers.length > 0,
				byElement = elementMatchers.length > 0,
				superMatcher = function( seed, context, xml, results, outermost ) {
					var elem, j, matcher,
						matchedCount = 0,
						i = "0",
						unmatched = seed && [],
						setMatched = [],
						contextBackup = outermostContext,

						// We must always have either seed elements or outermost context
						elems = seed || byElement && Expr.find.TAG( "*", outermost ),

						// Use integer dirruns iff this is the outermost matcher
						dirrunsUnique = ( dirruns += contextBackup == null ? 1 : Math.random() || 0.1 ),
						len = elems.length;

					if ( outermost ) {

						// Support: IE 11+, Edge 17 - 18+
						// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
						// two documents; shallow comparisons work.
						// eslint-disable-next-line eqeqeq
						outermostContext = context == document || context || outermost;
					}

					// Add elements passing elementMatchers directly to results
					// Support: iOS <=7 - 9 only
					// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching
					// elements by id. (see trac-14142)
					for ( ; i !== len && ( elem = elems[ i ] ) != null; i++ ) {
						if ( byElement && elem ) {
							j = 0;

							// Support: IE 11+, Edge 17 - 18+
							// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
							// two documents; shallow comparisons work.
							// eslint-disable-next-line eqeqeq
							if ( !context && elem.ownerDocument != document ) {
								setDocument( elem );
								xml = !documentIsHTML;
							}
							while ( ( matcher = elementMatchers[ j++ ] ) ) {
								if ( matcher( elem, context || document, xml ) ) {
									push.call( results, elem );
									break;
								}
							}
							if ( outermost ) {
								dirruns = dirrunsUnique;
							}
						}

						// Track unmatched elements for set filters
						if ( bySet ) {

							// They will have gone through all possible matchers
							if ( ( elem = !matcher && elem ) ) {
								matchedCount--;
							}

							// Lengthen the array for every element, matched or not
							if ( seed ) {
								unmatched.push( elem );
							}
						}
					}

					// `i` is now the count of elements visited above, and adding it to `matchedCount`
					// makes the latter nonnegative.
					matchedCount += i;

					// Apply set filters to unmatched elements
					// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
					// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
					// no element matchers and no seed.
					// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
					// case, which will result in a "00" `matchedCount` that differs from `i` but is also
					// numerically zero.
					if ( bySet && i !== matchedCount ) {
						j = 0;
						while ( ( matcher = setMatchers[ j++ ] ) ) {
							matcher( unmatched, setMatched, context, xml );
						}

						if ( seed ) {

							// Reintegrate element matches to eliminate the need for sorting
							if ( matchedCount > 0 ) {
								while ( i-- ) {
									if ( !( unmatched[ i ] || setMatched[ i ] ) ) {
										setMatched[ i ] = pop.call( results );
									}
								}
							}

							// Discard index placeholder values to get only actual matches
							setMatched = condense( setMatched );
						}

						// Add matches to results
						push.apply( results, setMatched );

						// Seedless set matches succeeding multiple successful matchers stipulate sorting
						if ( outermost && !seed && setMatched.length > 0 &&
							( matchedCount + setMatchers.length ) > 1 ) {

							jQuery.uniqueSort( results );
						}
					}

					// Override manipulation of globals by nested matchers
					if ( outermost ) {
						dirruns = dirrunsUnique;
						outermostContext = contextBackup;
					}

					return unmatched;
				};

			return bySet ?
				markFunction( superMatcher ) :
				superMatcher;
		}

		function compile( selector, match /* Internal Use Only */ ) {
			var i,
				setMatchers = [],
				elementMatchers = [],
				cached = compilerCache[ selector + " " ];

			if ( !cached ) {

				// Generate a function of recursive functions that can be used to check each element
				if ( !match ) {
					match = tokenize( selector );
				}
				i = match.length;
				while ( i-- ) {
					cached = matcherFromTokens( match[ i ] );
					if ( cached[ expando ] ) {
						setMatchers.push( cached );
					} else {
						elementMatchers.push( cached );
					}
				}

				// Cache the compiled function
				cached = compilerCache( selector,
					matcherFromGroupMatchers( elementMatchers, setMatchers ) );

				// Save selector and tokenization
				cached.selector = selector;
			}
			return cached;
		}

		/**
		 * A low-level selection function that works with jQuery's compiled
		 *  selector functions
		 * @param {String|Function} selector A selector or a pre-compiled
		 *  selector function built with jQuery selector compile
		 * @param {Element} context
		 * @param {Array} [results]
		 * @param {Array} [seed] A set of elements to match against
		 */
		function select( selector, context, results, seed ) {
			var i, tokens, token, type, find,
				compiled = typeof selector === "function" && selector,
				match = !seed && tokenize( ( selector = compiled.selector || selector ) );

			results = results || [];

			// Try to minimize operations if there is only one selector in the list and no seed
			// (the latter of which guarantees us context)
			if ( match.length === 1 ) {

				// Reduce context if the leading compound selector is an ID
				tokens = match[ 0 ] = match[ 0 ].slice( 0 );
				if ( tokens.length > 2 && ( token = tokens[ 0 ] ).type === "ID" &&
					context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[ 1 ].type ] ) {

					context = ( Expr.find.ID(
						token.matches[ 0 ].replace( runescape, funescape ),
						context
					) || [] )[ 0 ];
					if ( !context ) {
						return results;

						// Precompiled matchers will still verify ancestry, so step up a level
					} else if ( compiled ) {
						context = context.parentNode;
					}

					selector = selector.slice( tokens.shift().value.length );
				}

				// Fetch a seed set for right-to-left matching
				i = matchExpr.needsContext.test( selector ) ? 0 : tokens.length;
				while ( i-- ) {
					token = tokens[ i ];

					// Abort if we hit a combinator
					if ( Expr.relative[ ( type = token.type ) ] ) {
						break;
					}
					if ( ( find = Expr.find[ type ] ) ) {

						// Search, expanding context for leading sibling combinators
						if ( ( seed = find(
							token.matches[ 0 ].replace( runescape, funescape ),
							rsibling.test( tokens[ 0 ].type ) &&
							testContext( context.parentNode ) || context
						) ) ) {

							// If seed is empty or no tokens remain, we can return early
							tokens.splice( i, 1 );
							selector = seed.length && toSelector( tokens );
							if ( !selector ) {
								push.apply( results, seed );
								return results;
							}

							break;
						}
					}
				}
			}

			// Compile and execute a filtering function if one is not provided
			// Provide `match` to avoid retokenization if we modified the selector above
			( compiled || compile( selector, match ) )(
				seed,
				context,
				!documentIsHTML,
				results,
				!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
			);
			return results;
		}

// One-time assignments

// Support: Android <=4.0 - 4.1+
// Sort stability
		support.sortStable = expando.split( "" ).sort( sortOrder ).join( "" ) === expando;

// Initialize against the default document
		setDocument();

// Support: Android <=4.0 - 4.1+
// Detached nodes confoundingly follow *each other*
		support.sortDetached = assert( function( el ) {

			// Should return 1, but returns 4 (following)
			return el.compareDocumentPosition( document.createElement( "fieldset" ) ) & 1;
		} );

		jQuery.find = find;

// Deprecated
		jQuery.expr[ ":" ] = jQuery.expr.pseudos;
		jQuery.unique = jQuery.uniqueSort;

// These have always been private, but they used to be documented as part of
// Sizzle so let's maintain them for now for backwards compatibility purposes.
		find.compile = compile;
		find.select = select;
		find.setDocument = setDocument;
		find.tokenize = tokenize;

		find.escape = jQuery.escapeSelector;
		find.getText = jQuery.text;
		find.isXML = jQuery.isXMLDoc;
		find.selectors = jQuery.expr;
		find.support = jQuery.support;
		find.uniqueSort = jQuery.uniqueSort;

		/* eslint-enable */

	} )();


	var dir = function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	};


	var siblings = function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	};


	var rneedsContext = jQuery.expr.match.needsContext;

	var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, not ) {
		if ( isFunction( qualifier ) ) {
			return jQuery.grep( elements, function( elem, i ) {
				return !!qualifier.call( elem, i, elem ) !== not;
			} );
		}

		// Single element
		if ( qualifier.nodeType ) {
			return jQuery.grep( elements, function( elem ) {
				return ( elem === qualifier ) !== not;
			} );
		}

		// Arraylike of elements (jQuery, arguments, Array)
		if ( typeof qualifier !== "string" ) {
			return jQuery.grep( elements, function( elem ) {
				return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
			} );
		}

		// Filtered directly for both simple and complex selectors
		return jQuery.filter( qualifier, elements, not );
	}

	jQuery.filter = function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		if ( elems.length === 1 && elem.nodeType === 1 ) {
			return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
		}

		return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		} ) );
	};

	jQuery.fn.extend( {
		find: function( selector ) {
			var i, ret,
				len = this.length,
				self = this;

			if ( typeof selector !== "string" ) {
				return this.pushStack( jQuery( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}

			ret = this.pushStack( [] );

			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, self[ i ], ret );
			}

			return len > 1 ? jQuery.uniqueSort( ret ) : ret;
		},
		filter: function( selector ) {
			return this.pushStack( winnow( this, selector || [], false ) );
		},
		not: function( selector ) {
			return this.pushStack( winnow( this, selector || [], true ) );
		},
		is: function( selector ) {
			return !!winnow(
				this,

				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				typeof selector === "string" && rneedsContext.test( selector ) ?
					jQuery( selector ) :
					selector || [],
				false
			).length;
		}
	} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
	var rootjQuery,

		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
		// Strict HTML recognition (trac-11290: must start with <)
		// Shortcut simple #id case for speed
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

		init = jQuery.fn.init = function( selector, context, root ) {
			var match, elem;

			// HANDLE: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}

			// Method init() accepts an alternate rootjQuery
			// so migrate can support jQuery.sub (gh-2101)
			root = root || rootjQuery;

			// Handle HTML strings
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {

					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];

				} else {
					match = rquickExpr.exec( selector );
				}

				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {

					// HANDLE: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof jQuery ? context[ 0 ] : context;

						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						jQuery.merge( this, jQuery.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );

						// HANDLE: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
							for ( match in context ) {

								// Properties of context are called as methods if possible
								if ( isFunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );

									// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}

						return this;

						// HANDLE: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );

						if ( elem ) {

							// Inject the element directly into the jQuery object
							this[ 0 ] = elem;
							this.length = 1;
						}
						return this;
					}

					// HANDLE: $(expr, $(...))
				} else if ( !context || context.jquery ) {
					return ( context || root ).find( selector );

					// HANDLE: $(expr, context)
					// (which is just equivalent to: $(context).find(expr)
				} else {
					return this.constructor( context ).find( selector );
				}

				// HANDLE: $(DOMElement)
			} else if ( selector.nodeType ) {
				this[ 0 ] = selector;
				this.length = 1;
				return this;

				// HANDLE: $(function)
				// Shortcut for document ready
			} else if ( isFunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) :

					// Execute immediately if ready is not present
					selector( jQuery );
			}

			return jQuery.makeArray( selector, this );
		};

// Give the init function the jQuery prototype for later instantiation
	init.prototype = jQuery.fn;

// Initialize central reference
	rootjQuery = jQuery( document );


	var rparentsprev = /^(?:parents|prev(?:Until|All))/,

		// Methods guaranteed to produce a unique set when starting from a unique set
		guaranteedUnique = {
			children: true,
			contents: true,
			next: true,
			prev: true
		};

	jQuery.fn.extend( {
		has: function( target ) {
			var targets = jQuery( target, this ),
				l = targets.length;

			return this.filter( function() {
				var i = 0;
				for ( ; i < l; i++ ) {
					if ( jQuery.contains( this, targets[ i ] ) ) {
						return true;
					}
				}
			} );
		},

		closest: function( selectors, context ) {
			var cur,
				i = 0,
				l = this.length,
				matched = [],
				targets = typeof selectors !== "string" && jQuery( selectors );

			// Positional selectors never match, since there's no _selection_ context
			if ( !rneedsContext.test( selectors ) ) {
				for ( ; i < l; i++ ) {
					for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

						// Always skip document fragments
						if ( cur.nodeType < 11 && ( targets ?
							targets.index( cur ) > -1 :

							// Don't pass non-elements to jQuery#find
							cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

							matched.push( cur );
							break;
						}
					}
				}
			}

			return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
		},

		// Determine the position of an element within the set
		index: function( elem ) {

			// No argument, return index in parent
			if ( !elem ) {
				return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
			}

			// Index in selector
			if ( typeof elem === "string" ) {
				return indexOf.call( jQuery( elem ), this[ 0 ] );
			}

			// Locate the position of the desired element
			return indexOf.call( this,

				// If it receives a jQuery object, the first element is used
				elem.jquery ? elem[ 0 ] : elem
			);
		},

		add: function( selector, context ) {
			return this.pushStack(
				jQuery.uniqueSort(
					jQuery.merge( this.get(), jQuery( selector, context ) )
				)
			);
		},

		addBack: function( selector ) {
			return this.add( selector == null ?
				this.prevObject : this.prevObject.filter( selector )
			);
		}
	} );

	function sibling( cur, dir ) {
		while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
		return cur;
	}

	jQuery.each( {
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, _i, until ) {
			return dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return sibling( elem, "nextSibling" );
		},
		prev: function( elem ) {
			return sibling( elem, "previousSibling" );
		},
		nextAll: function( elem ) {
			return dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, _i, until ) {
			return dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, _i, until ) {
			return dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return siblings( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return siblings( elem.firstChild );
		},
		contents: function( elem ) {
			if ( elem.contentDocument != null &&

				// Support: IE 11+
				// <object> elements with no `data` attribute has an object
				// `contentDocument` with a `null` prototype.
				getProto( elem.contentDocument ) ) {

				return elem.contentDocument;
			}

			// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
			// Treat the template element as a regular one in browsers that
			// don't support it.
			if ( nodeName( elem, "template" ) ) {
				elem = elem.content || elem;
			}

			return jQuery.merge( [], elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var matched = jQuery.map( this, fn, until );

			if ( name.slice( -5 ) !== "Until" ) {
				selector = until;
			}

			if ( selector && typeof selector === "string" ) {
				matched = jQuery.filter( selector, matched );
			}

			if ( this.length > 1 ) {

				// Remove duplicates
				if ( !guaranteedUnique[ name ] ) {
					jQuery.uniqueSort( matched );
				}

				// Reverse order for parents* and prev-derivatives
				if ( rparentsprev.test( name ) ) {
					matched.reverse();
				}
			}

			return this.pushStack( matched );
		};
	} );
	var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
	function createOptions( options ) {
		var object = {};
		jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
			object[ flag ] = true;
		} );
		return object;
	}

	/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
	jQuery.Callbacks = function( options ) {

		// Convert options from String-formatted to Object-formatted if needed
		// (we check in cache first)
		options = typeof options === "string" ?
			createOptions( options ) :
			jQuery.extend( {}, options );

		var // Flag to know if list is currently firing
			firing,

			// Last fire value for non-forgettable lists
			memory,

			// Flag to know if list was already fired
			fired,

			// Flag to prevent firing
			locked,

			// Actual callback list
			list = [],

			// Queue of execution data for repeatable lists
			queue = [],

			// Index of currently firing callback (modified by add/remove as needed)
			firingIndex = -1,

			// Fire callbacks
			fire = function() {

				// Enforce single-firing
				locked = locked || options.once;

				// Execute callbacks for all pending executions,
				// respecting firingIndex overrides and runtime changes
				fired = firing = true;
				for ( ; queue.length; firingIndex = -1 ) {
					memory = queue.shift();
					while ( ++firingIndex < list.length ) {

						// Run callback and check for early termination
						if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
							options.stopOnFalse ) {

							// Jump to end and forget the data so .add doesn't re-fire
							firingIndex = list.length;
							memory = false;
						}
					}
				}

				// Forget the data if we're done with it
				if ( !options.memory ) {
					memory = false;
				}

				firing = false;

				// Clean up if we're done firing for good
				if ( locked ) {

					// Keep an empty list if we have data for future add calls
					if ( memory ) {
						list = [];

						// Otherwise, this object is spent
					} else {
						list = "";
					}
				}
			},

			// Actual Callbacks object
			self = {

				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {

						// If we have memory from a past run, we should fire after adding
						if ( memory && !firing ) {
							firingIndex = list.length - 1;
							queue.push( memory );
						}

						( function add( args ) {
							jQuery.each( args, function( _, arg ) {
								if ( isFunction( arg ) ) {
									if ( !options.unique || !self.has( arg ) ) {
										list.push( arg );
									}
								} else if ( arg && arg.length && toType( arg ) !== "string" ) {

									// Inspect recursively
									add( arg );
								}
							} );
						} )( arguments );

						if ( memory && !firing ) {
							fire();
						}
					}
					return this;
				},

				// Remove a callback from the list
				remove: function() {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );

							// Handle firing indexes
							if ( index <= firingIndex ) {
								firingIndex--;
							}
						}
					} );
					return this;
				},

				// Check if a given callback is in the list.
				// If no argument is given, return whether or not list has callbacks attached.
				has: function( fn ) {
					return fn ?
						jQuery.inArray( fn, list ) > -1 :
						list.length > 0;
				},

				// Remove all callbacks from the list
				empty: function() {
					if ( list ) {
						list = [];
					}
					return this;
				},

				// Disable .fire and .add
				// Abort any current/pending executions
				// Clear all callbacks and values
				disable: function() {
					locked = queue = [];
					list = memory = "";
					return this;
				},
				disabled: function() {
					return !list;
				},

				// Disable .fire
				// Also disable .add unless we have memory (since it would have no effect)
				// Abort any pending executions
				lock: function() {
					locked = queue = [];
					if ( !memory && !firing ) {
						list = memory = "";
					}
					return this;
				},
				locked: function() {
					return !!locked;
				},

				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( !locked ) {
						args = args || [];
						args = [ context, args.slice ? args.slice() : args ];
						queue.push( args );
						if ( !firing ) {
							fire();
						}
					}
					return this;
				},

				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},

				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};

		return self;
	};


	function Identity( v ) {
		return v;
	}
	function Thrower( ex ) {
		throw ex;
	}

	function adoptValue( value, resolve, reject, noValue ) {
		var method;

		try {

			// Check for promise aspect first to privilege synchronous behavior
			if ( value && isFunction( ( method = value.promise ) ) ) {
				method.call( value ).done( resolve ).fail( reject );

				// Other thenables
			} else if ( value && isFunction( ( method = value.then ) ) ) {
				method.call( value, resolve, reject );

				// Other non-thenables
			} else {

				// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
				// * false: [ value ].slice( 0 ) => resolve( value )
				// * true: [ value ].slice( 1 ) => resolve()
				resolve.apply( undefined, [ value ].slice( noValue ) );
			}

			// For Promises/A+, convert exceptions into rejections
			// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
			// Deferred#then to conditionally suppress rejection.
		} catch ( value ) {

			// Support: Android 4.0 only
			// Strict mode functions invoked without .call/.apply get global-object context
			reject.apply( undefined, [ value ] );
		}
	}

	jQuery.extend( {

		Deferred: function( func ) {
			var tuples = [

					// action, add listener, callbacks,
					// ... .then handlers, argument index, [final state]
					[ "notify", "progress", jQuery.Callbacks( "memory" ),
						jQuery.Callbacks( "memory" ), 2 ],
					[ "resolve", "done", jQuery.Callbacks( "once memory" ),
						jQuery.Callbacks( "once memory" ), 0, "resolved" ],
					[ "reject", "fail", jQuery.Callbacks( "once memory" ),
						jQuery.Callbacks( "once memory" ), 1, "rejected" ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					"catch": function( fn ) {
						return promise.then( null, fn );
					},

					// Keep pipe for back-compat
					pipe: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;

						return jQuery.Deferred( function( newDefer ) {
							jQuery.each( tuples, function( _i, tuple ) {

								// Map tuples (progress, done, fail) to arguments (done, fail, progress)
								var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

								// deferred.progress(function() { bind to newDefer or newDefer.notify })
								// deferred.done(function() { bind to newDefer or newDefer.resolve })
								// deferred.fail(function() { bind to newDefer or newDefer.reject })
								deferred[ tuple[ 1 ] ]( function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && isFunction( returned.promise ) ) {
										returned.promise()
											.progress( newDefer.notify )
											.done( newDefer.resolve )
											.fail( newDefer.reject );
									} else {
										newDefer[ tuple[ 0 ] + "With" ](
											this,
											fn ? [ returned ] : arguments
										);
									}
								} );
							} );
							fns = null;
						} ).promise();
					},
					then: function( onFulfilled, onRejected, onProgress ) {
						var maxDepth = 0;
						function resolve( depth, deferred, handler, special ) {
							return function() {
								var that = this,
									args = arguments,
									mightThrow = function() {
										var returned, then;

										// Support: Promises/A+ section 2.3.3.3.3
										// https://promisesaplus.com/#point-59
										// Ignore double-resolution attempts
										if ( depth < maxDepth ) {
											return;
										}

										returned = handler.apply( that, args );

										// Support: Promises/A+ section 2.3.1
										// https://promisesaplus.com/#point-48
										if ( returned === deferred.promise() ) {
											throw new TypeError( "Thenable self-resolution" );
										}

										// Support: Promises/A+ sections 2.3.3.1, 3.5
										// https://promisesaplus.com/#point-54
										// https://promisesaplus.com/#point-75
										// Retrieve `then` only once
										then = returned &&

											// Support: Promises/A+ section 2.3.4
											// https://promisesaplus.com/#point-64
											// Only check objects and functions for thenability
											( typeof returned === "object" ||
												typeof returned === "function" ) &&
											returned.then;

										// Handle a returned thenable
										if ( isFunction( then ) ) {

											// Special processors (notify) just wait for resolution
											if ( special ) {
												then.call(
													returned,
													resolve( maxDepth, deferred, Identity, special ),
													resolve( maxDepth, deferred, Thrower, special )
												);

												// Normal processors (resolve) also hook into progress
											} else {

												// ...and disregard older resolution values
												maxDepth++;

												then.call(
													returned,
													resolve( maxDepth, deferred, Identity, special ),
													resolve( maxDepth, deferred, Thrower, special ),
													resolve( maxDepth, deferred, Identity,
														deferred.notifyWith )
												);
											}

											// Handle all other returned values
										} else {

											// Only substitute handlers pass on context
											// and multiple values (non-spec behavior)
											if ( handler !== Identity ) {
												that = undefined;
												args = [ returned ];
											}

											// Process the value(s)
											// Default process is resolve
											( special || deferred.resolveWith )( that, args );
										}
									},

									// Only normal processors (resolve) catch and reject exceptions
									process = special ?
										mightThrow :
										function() {
											try {
												mightThrow();
											} catch ( e ) {

												if ( jQuery.Deferred.exceptionHook ) {
													jQuery.Deferred.exceptionHook( e,
														process.error );
												}

												// Support: Promises/A+ section 2.3.3.3.4.1
												// https://promisesaplus.com/#point-61
												// Ignore post-resolution exceptions
												if ( depth + 1 >= maxDepth ) {

													// Only substitute handlers pass on context
													// and multiple values (non-spec behavior)
													if ( handler !== Thrower ) {
														that = undefined;
														args = [ e ];
													}

													deferred.rejectWith( that, args );
												}
											}
										};

								// Support: Promises/A+ section 2.3.3.3.1
								// https://promisesaplus.com/#point-57
								// Re-resolve promises immediately to dodge false rejection from
								// subsequent errors
								if ( depth ) {
									process();
								} else {

									// Call an optional hook to record the error, in case of exception
									// since it's otherwise lost when execution goes async
									if ( jQuery.Deferred.getErrorHook ) {
										process.error = jQuery.Deferred.getErrorHook();

										// The deprecated alias of the above. While the name suggests
										// returning the stack, not an error instance, jQuery just passes
										// it directly to `console.warn` so both will work; an instance
										// just better cooperates with source maps.
									} else if ( jQuery.Deferred.getStackHook ) {
										process.error = jQuery.Deferred.getStackHook();
									}
									window.setTimeout( process );
								}
							};
						}

						return jQuery.Deferred( function( newDefer ) {

							// progress_handlers.add( ... )
							tuples[ 0 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onProgress ) ?
										onProgress :
										Identity,
									newDefer.notifyWith
								)
							);

							// fulfilled_handlers.add( ... )
							tuples[ 1 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onFulfilled ) ?
										onFulfilled :
										Identity
								)
							);

							// rejected_handlers.add( ... )
							tuples[ 2 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onRejected ) ?
										onRejected :
										Thrower
								)
							);
						} ).promise();
					},

					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? jQuery.extend( obj, promise ) : promise;
					}
				},
				deferred = {};

			// Add list-specific methods
			jQuery.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 5 ];

				// promise.progress = list.add
				// promise.done = list.add
				// promise.fail = list.add
				promise[ tuple[ 1 ] ] = list.add;

				// Handle state
				if ( stateString ) {
					list.add(
						function() {

							// state = "resolved" (i.e., fulfilled)
							// state = "rejected"
							state = stateString;
						},

						// rejected_callbacks.disable
						// fulfilled_callbacks.disable
						tuples[ 3 - i ][ 2 ].disable,

						// rejected_handlers.disable
						// fulfilled_handlers.disable
						tuples[ 3 - i ][ 3 ].disable,

						// progress_callbacks.lock
						tuples[ 0 ][ 2 ].lock,

						// progress_handlers.lock
						tuples[ 0 ][ 3 ].lock
					);
				}

				// progress_handlers.fire
				// fulfilled_handlers.fire
				// rejected_handlers.fire
				list.add( tuple[ 3 ].fire );

				// deferred.notify = function() { deferred.notifyWith(...) }
				// deferred.resolve = function() { deferred.resolveWith(...) }
				// deferred.reject = function() { deferred.rejectWith(...) }
				deferred[ tuple[ 0 ] ] = function() {
					deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
					return this;
				};

				// deferred.notifyWith = list.fireWith
				// deferred.resolveWith = list.fireWith
				// deferred.rejectWith = list.fireWith
				deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
			} );

			// Make the deferred a promise
			promise.promise( deferred );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},

		// Deferred helper
		when: function( singleValue ) {
			var

				// count of uncompleted subordinates
				remaining = arguments.length,

				// count of unprocessed arguments
				i = remaining,

				// subordinate fulfillment data
				resolveContexts = Array( i ),
				resolveValues = slice.call( arguments ),

				// the primary Deferred
				primary = jQuery.Deferred(),

				// subordinate callback factory
				updateFunc = function( i ) {
					return function( value ) {
						resolveContexts[ i ] = this;
						resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
						if ( !( --remaining ) ) {
							primary.resolveWith( resolveContexts, resolveValues );
						}
					};
				};

			// Single- and empty arguments are adopted like Promise.resolve
			if ( remaining <= 1 ) {
				adoptValue( singleValue, primary.done( updateFunc( i ) ).resolve, primary.reject,
					!remaining );

				// Use .then() to unwrap secondary thenables (cf. gh-3000)
				if ( primary.state() === "pending" ||
					isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

					return primary.then();
				}
			}

			// Multiple arguments are aggregated like Promise.all array elements
			while ( i-- ) {
				adoptValue( resolveValues[ i ], updateFunc( i ), primary.reject );
			}

			return primary.promise();
		}
	} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
	var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

// If `jQuery.Deferred.getErrorHook` is defined, `asyncError` is an error
// captured before the async barrier to get the original error cause
// which may otherwise be hidden.
	jQuery.Deferred.exceptionHook = function( error, asyncError ) {

		// Support: IE 8 - 9 only
		// Console exists when dev tools are open, which can happen at any time
		if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
			window.console.warn( "jQuery.Deferred exception: " + error.message,
				error.stack, asyncError );
		}
	};




	jQuery.readyException = function( error ) {
		window.setTimeout( function() {
			throw error;
		} );
	};




// The deferred used on DOM ready
	var readyList = jQuery.Deferred();

	jQuery.fn.ready = function( fn ) {

		readyList
			.then( fn )

			// Wrap jQuery.readyException in a function so that the lookup
			// happens at the time of error handling instead of callback
			// registration.
			.catch( function( error ) {
				jQuery.readyException( error );
			} );

		return this;
	};

	jQuery.extend( {

		// Is the DOM ready to be used? Set to true once it occurs.
		isReady: false,

		// A counter to track how many items to wait for before
		// the ready event fires. See trac-6781
		readyWait: 1,

		// Handle when the DOM is ready
		ready: function( wait ) {

			// Abort if there are pending holds or we're already ready
			if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
				return;
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}

			// If there are functions bound, to execute
			readyList.resolveWith( document, [ jQuery ] );
		}
	} );

	jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );
		jQuery.ready();
	}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
	if ( document.readyState === "complete" ||
		( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

		// Handle it asynchronously to allow scripts the opportunity to delay ready
		window.setTimeout( jQuery.ready );

	} else {

		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", completed );

		// A fallback to window.onload, that will always work
		window.addEventListener( "load", completed );
	}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
	var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			len = elems.length,
			bulk = key == null;

		// Sets many values
		if ( toType( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				access( elems, fn, i, key[ i ], true, emptyGet, raw );
			}

			// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {

				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

					// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, _key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < len; i++ ) {
					fn(
						elems[ i ], key, raw ?
							value :
							value.call( elems[ i ], i, fn( elems[ i ], key ) )
					);
				}
			}
		}

		if ( chainable ) {
			return elems;
		}

		// Gets
		if ( bulk ) {
			return fn.call( elems );
		}

		return len ? fn( elems[ 0 ], key ) : emptyGet;
	};


// Matches dashed string for camelizing
	var rmsPrefix = /^-ms-/,
		rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
	function fcamelCase( _all, letter ) {
		return letter.toUpperCase();
	}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (trac-9572)
	function camelCase( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	}
	var acceptData = function( owner ) {

		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};




	function Data() {
		this.expando = jQuery.expando + Data.uid++;
	}

	Data.uid = 1;

	Data.prototype = {

		cache: function( owner ) {

			// Check if the owner object already has a cache
			var value = owner[ this.expando ];

			// If not, create one
			if ( !value ) {
				value = {};

				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see trac-8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {

					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;

						// Otherwise secure it in a non-enumerable property
						// configurable must be true to allow the property to be
						// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}

			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );

			// Handle: [ owner, key, value ] args
			// Always use camelCase key (gh-2257)
			if ( typeof data === "string" ) {
				cache[ camelCase( data ) ] = value;

				// Handle: [ owner, { properties } ] args
			} else {

				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ camelCase( prop ) ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :

				// Always use camelCase key (gh-2257)
				owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
		},
		access: function( owner, key, value ) {

			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

				return this.get( owner, key );
			}

			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );

			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i,
				cache = owner[ this.expando ];

			if ( cache === undefined ) {
				return;
			}

			if ( key !== undefined ) {

				// Support array or space separated string of keys
				if ( Array.isArray( key ) ) {

					// If key is an array of keys...
					// We always set camelCase keys, so remove that.
					key = key.map( camelCase );
				} else {
					key = camelCase( key );

					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					key = key in cache ?
						[ key ] :
						( key.match( rnothtmlwhite ) || [] );
				}

				i = key.length;

				while ( i-- ) {
					delete cache[ key[ i ] ];
				}
			}

			// Remove the expando if there's no more data
			if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

				// Support: Chrome <=35 - 45
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !jQuery.isEmptyObject( cache );
		}
	};
	var dataPriv = new Data();

	var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

	var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
		rmultiDash = /[A-Z]/g;

	function getData( data ) {
		if ( data === "true" ) {
			return true;
		}

		if ( data === "false" ) {
			return false;
		}

		if ( data === "null" ) {
			return null;
		}

		// Only convert to a number if it doesn't change the string
		if ( data === +data + "" ) {
			return +data;
		}

		if ( rbrace.test( data ) ) {
			return JSON.parse( data );
		}

		return data;
	}

	function dataAttr( elem, key, data ) {
		var name;

		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = getData( data );
				} catch ( e ) {}

				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	}

	jQuery.extend( {
		hasData: function( elem ) {
			return dataUser.hasData( elem ) || dataPriv.hasData( elem );
		},

		data: function( elem, name, data ) {
			return dataUser.access( elem, name, data );
		},

		removeData: function( elem, name ) {
			dataUser.remove( elem, name );
		},

		// TODO: Now that all calls to _data and _removeData have been replaced
		// with direct calls to dataPriv methods, these can be deprecated.
		_data: function( elem, name, data ) {
			return dataPriv.access( elem, name, data );
		},

		_removeData: function( elem, name ) {
			dataPriv.remove( elem, name );
		}
	} );

	jQuery.fn.extend( {
		data: function( key, value ) {
			var i, name, data,
				elem = this[ 0 ],
				attrs = elem && elem.attributes;

			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = dataUser.get( elem );

					if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
						i = attrs.length;
						while ( i-- ) {

							// Support: IE 11 only
							// The attrs elements can be null (trac-14894)
							if ( attrs[ i ] ) {
								name = attrs[ i ].name;
								if ( name.indexOf( "data-" ) === 0 ) {
									name = camelCase( name.slice( 5 ) );
									dataAttr( elem, name, data[ name ] );
								}
							}
						}
						dataPriv.set( elem, "hasDataAttrs", true );
					}
				}

				return data;
			}

			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each( function() {
					dataUser.set( this, key );
				} );
			}

			return access( this, function( value ) {
				var data;

				// The calling jQuery object (element matches) is not empty
				// (and therefore has an element appears at this[ 0 ]) and the
				// `value` parameter was not undefined. An empty jQuery object
				// will result in `undefined` for elem = this[ 0 ] which will
				// throw an exception if an attempt to read a data cache is made.
				if ( elem && value === undefined ) {

					// Attempt to get data from the cache
					// The key will always be camelCased in Data
					data = dataUser.get( elem, key );
					if ( data !== undefined ) {
						return data;
					}

					// Attempt to "discover" the data in
					// HTML5 custom data-* attrs
					data = dataAttr( elem, key );
					if ( data !== undefined ) {
						return data;
					}

					// We tried really hard, but the data doesn't exist.
					return;
				}

				// Set the data...
				this.each( function() {

					// We always store the camelCased key
					dataUser.set( this, key, value );
				} );
			}, null, value, arguments.length > 1, null, true );
		},

		removeData: function( key ) {
			return this.each( function() {
				dataUser.remove( this, key );
			} );
		}
	} );


	jQuery.extend( {
		queue: function( elem, type, data ) {
			var queue;

			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				queue = dataPriv.get( elem, type );

				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !queue || Array.isArray( data ) ) {
						queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
					} else {
						queue.push( data );
					}
				}
				return queue || [];
			}
		},

		dequeue: function( elem, type ) {
			type = type || "fx";

			var queue = jQuery.queue( elem, type ),
				startLength = queue.length,
				fn = queue.shift(),
				hooks = jQuery._queueHooks( elem, type ),
				next = function() {
					jQuery.dequeue( elem, type );
				};

			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
				startLength--;
			}

			if ( fn ) {

				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}

				// Clear up the last queue stop function
				delete hooks.stop;
				fn.call( elem, next, hooks );
			}

			if ( !startLength && hooks ) {
				hooks.empty.fire();
			}
		},

		// Not public - generate a queueHooks object, or return the current one
		_queueHooks: function( elem, type ) {
			var key = type + "queueHooks";
			return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
				empty: jQuery.Callbacks( "once memory" ).add( function() {
					dataPriv.remove( elem, [ type + "queue", key ] );
				} )
			} );
		}
	} );

	jQuery.fn.extend( {
		queue: function( type, data ) {
			var setter = 2;

			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}

			if ( arguments.length < setter ) {
				return jQuery.queue( this[ 0 ], type );
			}

			return data === undefined ?
				this :
				this.each( function() {
					var queue = jQuery.queue( this, type, data );

					// Ensure a hooks for this queue
					jQuery._queueHooks( this, type );

					if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
						jQuery.dequeue( this, type );
					}
				} );
		},
		dequeue: function( type ) {
			return this.each( function() {
				jQuery.dequeue( this, type );
			} );
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},

		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, obj ) {
			var tmp,
				count = 1,
				defer = jQuery.Deferred(),
				elements = this,
				i = this.length,
				resolve = function() {
					if ( !( --count ) ) {
						defer.resolveWith( elements, [ elements ] );
					}
				};

			if ( typeof type !== "string" ) {
				obj = type;
				type = undefined;
			}
			type = type || "fx";

			while ( i-- ) {
				tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
				if ( tmp && tmp.empty ) {
					count++;
					tmp.empty.add( resolve );
				}
			}
			resolve();
			return defer.promise( obj );
		}
	} );
	var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

	var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


	var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

	var documentElement = document.documentElement;



	var isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem );
		},
		composed = { composed: true };

	// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
	// Check attachment across shadow DOM boundaries when possible (gh-3504)
	// Support: iOS 10.0-10.2 only
	// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
	// leading to errors. We need to check for `getRootNode`.
	if ( documentElement.getRootNode ) {
		isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem ) ||
				elem.getRootNode( composed ) === elem.ownerDocument;
		};
	}
	var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			isAttached( elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};



	function adjustCSS( elem, prop, valueParts, tween ) {
		var adjusted, scale,
			maxIterations = 20,
			currentValue = tween ?
				function() {
					return tween.cur();
				} :
				function() {
					return jQuery.css( elem, prop, "" );
				},
			initial = currentValue(),
			unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

			// Starting value computation is required for potential unit mismatches
			initialInUnit = elem.nodeType &&
				( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
				rcssNum.exec( jQuery.css( elem, prop ) );

		if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

			// Support: Firefox <=54
			// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
			initial = initial / 2;

			// Trust units reported by jQuery.css
			unit = unit || initialInUnit[ 3 ];

			// Iteratively approximate from a nonzero starting point
			initialInUnit = +initial || 1;

			while ( maxIterations-- ) {

				// Evaluate and update our best guess (doubling guesses that zero out).
				// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
				jQuery.style( elem, prop, initialInUnit + unit );
				if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
					maxIterations = 0;
				}
				initialInUnit = initialInUnit / scale;

			}

			initialInUnit = initialInUnit * 2;
			jQuery.style( elem, prop, initialInUnit + unit );

			// Make sure we update the tween properties later on
			valueParts = valueParts || [];
		}

		if ( valueParts ) {
			initialInUnit = +initialInUnit || +initial || 0;

			// Apply relative offset (+=/-=) if specified
			adjusted = valueParts[ 1 ] ?
				initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
				+valueParts[ 2 ];
			if ( tween ) {
				tween.unit = unit;
				tween.start = initialInUnit;
				tween.end = adjusted;
			}
		}
		return adjusted;
	}


	var defaultDisplayMap = {};

	function getDefaultDisplay( elem ) {
		var temp,
			doc = elem.ownerDocument,
			nodeName = elem.nodeName,
			display = defaultDisplayMap[ nodeName ];

		if ( display ) {
			return display;
		}

		temp = doc.body.appendChild( doc.createElement( nodeName ) );
		display = jQuery.css( temp, "display" );

		temp.parentNode.removeChild( temp );

		if ( display === "none" ) {
			display = "block";
		}
		defaultDisplayMap[ nodeName ] = display;

		return display;
	}

	function showHide( elements, show ) {
		var display, elem,
			values = [],
			index = 0,
			length = elements.length;

		// Determine new display value for elements that need to change
		for ( ; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}

			display = elem.style.display;
			if ( show ) {

				// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
				// check is required in this first loop unless we have a nonempty display value (either
				// inline or about-to-be-restored)
				if ( display === "none" ) {
					values[ index ] = dataPriv.get( elem, "display" ) || null;
					if ( !values[ index ] ) {
						elem.style.display = "";
					}
				}
				if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
					values[ index ] = getDefaultDisplay( elem );
				}
			} else {
				if ( display !== "none" ) {
					values[ index ] = "none";

					// Remember what we're overwriting
					dataPriv.set( elem, "display", display );
				}
			}
		}

		// Set the display of the elements in a second loop to avoid constant reflow
		for ( index = 0; index < length; index++ ) {
			if ( values[ index ] != null ) {
				elements[ index ].style.display = values[ index ];
			}
		}

		return elements;
	}

	jQuery.fn.extend( {
		show: function() {
			return showHide( this, true );
		},
		hide: function() {
			return showHide( this );
		},
		toggle: function( state ) {
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}

			return this.each( function() {
				if ( isHiddenWithinTree( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			} );
		}
	} );
	var rcheckableType = ( /^(?:checkbox|radio)$/i );

	var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

	var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



	( function() {
		var fragment = document.createDocumentFragment(),
			div = fragment.appendChild( document.createElement( "div" ) ),
			input = document.createElement( "input" );

		// Support: Android 4.0 - 4.3 only
		// Check state lost if the name is set (trac-11217)
		// Support: Windows Web Apps (WWA)
		// `name` and `type` must use .setAttribute for WWA (trac-14901)
		input.setAttribute( "type", "radio" );
		input.setAttribute( "checked", "checked" );
		input.setAttribute( "name", "t" );

		div.appendChild( input );

		// Support: Android <=4.1 only
		// Older WebKit doesn't clone checked state correctly in fragments
		support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

		// Support: IE <=11 only
		// Make sure textarea (and checkbox) defaultValue is properly cloned
		div.innerHTML = "<textarea>x</textarea>";
		support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

		// Support: IE <=9 only
		// IE <=9 replaces <option> tags with their contents when inserted outside of
		// the select element.
		div.innerHTML = "<option></option>";
		support.option = !!div.lastChild;
	} )();


// We have to close these tags to support XHTML (trac-13200)
	var wrapMap = {

		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;

// Support: IE <=9 only
	if ( !support.option ) {
		wrapMap.optgroup = wrapMap.option = [ 1, "<select multiple='multiple'>", "</select>" ];
	}


	function getAll( context, tag ) {

		// Support: IE <=9 - 11 only
		// Use typeof to avoid zero-argument method invocation on host objects (trac-15151)
		var ret;

		if ( typeof context.getElementsByTagName !== "undefined" ) {
			ret = context.getElementsByTagName( tag || "*" );

		} else if ( typeof context.querySelectorAll !== "undefined" ) {
			ret = context.querySelectorAll( tag || "*" );

		} else {
			ret = [];
		}

		if ( tag === undefined || tag && nodeName( context, tag ) ) {
			return jQuery.merge( [ context ], ret );
		}

		return ret;
	}


// Mark scripts as having already been evaluated
	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}


	var rhtml = /<|&#?\w+;/;

	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, attached, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( toType( elem ) === "object" ) {

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

					// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

					// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (trac-12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {

			// Skip elements already in the context collection (trac-4087)
			if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}

			attached = isAttached( elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( attached ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	}


	var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

	function returnTrue() {
		return true;
	}

	function returnFalse() {
		return false;
	}

	function on( elem, types, selector, data, fn, one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {

			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {

				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				on( elem, type, selector, data, types[ type ], one );
			}
			return elem;
		}

		if ( data == null && fn == null ) {

			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {

				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {

				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return elem;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {

				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};

			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return elem.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		} );
	}

	/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
	jQuery.event = {

		global: {},

		add: function( elem, types, handler, data, selector ) {

			var handleObjIn, eventHandle, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.get( elem );

			// Only attach events to objects that accept data
			if ( !acceptData( elem ) ) {
				return;
			}

			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}

			// Ensure that invalid selectors throw exceptions at attach time
			// Evaluate against documentElement in case elem is a non-element node (e.g., document)
			if ( selector ) {
				jQuery.find.matchesSelector( documentElement, selector );
			}

			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}

			// Init the element's event structure and main handler, if this is the first
			if ( !( events = elemData.events ) ) {
				events = elemData.events = Object.create( null );
			}
			if ( !( eventHandle = elemData.handle ) ) {
				eventHandle = elemData.handle = function( e ) {

					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
						jQuery.event.dispatch.apply( elem, arguments ) : undefined;
				};
			}

			// Handle multiple events separated by a space
			types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// There *must* be a type, no attaching namespace-only handlers
				if ( !type ) {
					continue;
				}

				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};

				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;

				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};

				// handleObj is passed to all event handlers
				handleObj = jQuery.extend( {
					type: type,
					origType: origType,
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
					namespace: namespaces.join( "." )
				}, handleObjIn );

				// Init the event handler queue if we're the first
				if ( !( handlers = events[ type ] ) ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;

					// Only use addEventListener if the special events handler returns false
					if ( !special.setup ||
						special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle );
						}
					}
				}

				if ( special.add ) {
					special.add.call( elem, handleObj );

					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}

				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}

				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}

		},

		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {

			var j, origCount, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

			if ( !elemData || !( events = elemData.events ) ) {
				return;
			}

			// Once for each type.namespace in types; type may be omitted
			types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}

				special = jQuery.event.special[ type ] || {};
				type = ( selector ? special.delegateType : special.bindType ) || type;
				handlers = events[ type ] || [];
				tmp = tmp[ 2 ] &&
					new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

				// Remove matching events
				origCount = j = handlers.length;
				while ( j-- ) {
					handleObj = handlers[ j ];

					if ( ( mappedTypes || origType === handleObj.origType ) &&
						( !handler || handler.guid === handleObj.guid ) &&
						( !tmp || tmp.test( handleObj.namespace ) ) &&
						( !selector || selector === handleObj.selector ||
							selector === "**" && handleObj.selector ) ) {
						handlers.splice( j, 1 );

						if ( handleObj.selector ) {
							handlers.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}

				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( origCount && !handlers.length ) {
					if ( !special.teardown ||
						special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

						jQuery.removeEvent( elem, type, elemData.handle );
					}

					delete events[ type ];
				}
			}

			// Remove data and the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				dataPriv.remove( elem, "handle events" );
			}
		},

		dispatch: function( nativeEvent ) {

			var i, j, ret, matched, handleObj, handlerQueue,
				args = new Array( arguments.length ),

				// Make a writable jQuery.Event from the native event object
				event = jQuery.event.fix( nativeEvent ),

				handlers = (
					dataPriv.get( this, "events" ) || Object.create( null )
				)[ event.type ] || [],
				special = jQuery.event.special[ event.type ] || {};

			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[ 0 ] = event;

			for ( i = 1; i < arguments.length; i++ ) {
				args[ i ] = arguments[ i ];
			}

			event.delegateTarget = this;

			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}

			// Determine handlers
			handlerQueue = jQuery.event.handlers.call( this, event, handlers );

			// Run delegates first; they may want to stop propagation beneath us
			i = 0;
			while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
				event.currentTarget = matched.elem;

				j = 0;
				while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

					// If the event is namespaced, then each handler is only invoked if it is
					// specially universal or its namespaces are a superset of the event's.
					if ( !event.rnamespace || handleObj.namespace === false ||
						event.rnamespace.test( handleObj.namespace ) ) {

						event.handleObj = handleObj;
						event.data = handleObj.data;

						ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
							handleObj.handler ).apply( matched.elem, args );

						if ( ret !== undefined ) {
							if ( ( event.result = ret ) === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}

			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}

			return event.result;
		},

		handlers: function( event, handlers ) {
			var i, handleObj, sel, matchedHandlers, matchedSelectors,
				handlerQueue = [],
				delegateCount = handlers.delegateCount,
				cur = event.target;

			// Find delegate handlers
			if ( delegateCount &&

				// Support: IE <=9
				// Black-hole SVG <use> instance trees (trac-13180)
				cur.nodeType &&

				// Support: Firefox <=42
				// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
				// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
				// Support: IE 11 only
				// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
				!( event.type === "click" && event.button >= 1 ) ) {

				for ( ; cur !== this; cur = cur.parentNode || this ) {

					// Don't check non-elements (trac-13208)
					// Don't process clicks on disabled elements (trac-6911, trac-8165, trac-11382, trac-11764)
					if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
						matchedHandlers = [];
						matchedSelectors = {};
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];

							// Don't conflict with Object.prototype properties (trac-13203)
							sel = handleObj.selector + " ";

							if ( matchedSelectors[ sel ] === undefined ) {
								matchedSelectors[ sel ] = handleObj.needsContext ?
									jQuery( sel, this ).index( cur ) > -1 :
									jQuery.find( sel, this, null, [ cur ] ).length;
							}
							if ( matchedSelectors[ sel ] ) {
								matchedHandlers.push( handleObj );
							}
						}
						if ( matchedHandlers.length ) {
							handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
						}
					}
				}
			}

			// Add the remaining (directly-bound) handlers
			cur = this;
			if ( delegateCount < handlers.length ) {
				handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
			}

			return handlerQueue;
		},

		addProp: function( name, hook ) {
			Object.defineProperty( jQuery.Event.prototype, name, {
				enumerable: true,
				configurable: true,

				get: isFunction( hook ) ?
					function() {
						if ( this.originalEvent ) {
							return hook( this.originalEvent );
						}
					} :
					function() {
						if ( this.originalEvent ) {
							return this.originalEvent[ name ];
						}
					},

				set: function( value ) {
					Object.defineProperty( this, name, {
						enumerable: true,
						configurable: true,
						writable: true,
						value: value
					} );
				}
			} );
		},

		fix: function( originalEvent ) {
			return originalEvent[ jQuery.expando ] ?
				originalEvent :
				new jQuery.Event( originalEvent );
		},

		special: {
			load: {

				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},
			click: {

				// Utilize native event to ensure correct state for checkable inputs
				setup: function( data ) {

					// For mutual compressibility with _default, replace `this` access with a local var.
					// `|| data` is dead code meant only to preserve the variable through minification.
					var el = this || data;

					// Claim the first handler
					if ( rcheckableType.test( el.type ) &&
						el.click && nodeName( el, "input" ) ) {

						// dataPriv.set( el, "click", ... )
						leverageNative( el, "click", true );
					}

					// Return false to allow normal processing in the caller
					return false;
				},
				trigger: function( data ) {

					// For mutual compressibility with _default, replace `this` access with a local var.
					// `|| data` is dead code meant only to preserve the variable through minification.
					var el = this || data;

					// Force setup before triggering a click
					if ( rcheckableType.test( el.type ) &&
						el.click && nodeName( el, "input" ) ) {

						leverageNative( el, "click" );
					}

					// Return non-false to allow normal event-path propagation
					return true;
				},

				// For cross-browser consistency, suppress native .click() on links
				// Also prevent it if we're currently inside a leveraged native-event stack
				_default: function( event ) {
					var target = event.target;
					return rcheckableType.test( target.type ) &&
						target.click && nodeName( target, "input" ) &&
						dataPriv.get( target, "click" ) ||
						nodeName( target, "a" );
				}
			},

			beforeunload: {
				postDispatch: function( event ) {

					// Support: Firefox 20+
					// Firefox doesn't alert if the returnValue field is not set.
					if ( event.result !== undefined && event.originalEvent ) {
						event.originalEvent.returnValue = event.result;
					}
				}
			}
		}
	};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
	function leverageNative( el, type, isSetup ) {

		// Missing `isSetup` indicates a trigger call, which must force setup through jQuery.event.add
		if ( !isSetup ) {
			if ( dataPriv.get( el, type ) === undefined ) {
				jQuery.event.add( el, type, returnTrue );
			}
			return;
		}

		// Register the controller as a special universal handler for all event namespaces
		dataPriv.set( el, type, false );
		jQuery.event.add( el, type, {
			namespace: false,
			handler: function( event ) {
				var result,
					saved = dataPriv.get( this, type );

				if ( ( event.isTrigger & 1 ) && this[ type ] ) {

					// Interrupt processing of the outer synthetic .trigger()ed event
					if ( !saved ) {

						// Store arguments for use when handling the inner native event
						// There will always be at least one argument (an event object), so this array
						// will not be confused with a leftover capture object.
						saved = slice.call( arguments );
						dataPriv.set( this, type, saved );

						// Trigger the native event and capture its result
						this[ type ]();
						result = dataPriv.get( this, type );
						dataPriv.set( this, type, false );

						if ( saved !== result ) {

							// Cancel the outer synthetic event
							event.stopImmediatePropagation();
							event.preventDefault();

							return result;
						}

						// If this is an inner synthetic event for an event with a bubbling surrogate
						// (focus or blur), assume that the surrogate already propagated from triggering
						// the native event and prevent that from happening again here.
						// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
						// bubbling surrogate propagates *after* the non-bubbling base), but that seems
						// less bad than duplication.
					} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
						event.stopPropagation();
					}

					// If this is a native event triggered above, everything is now in order
					// Fire an inner synthetic event with the original arguments
				} else if ( saved ) {

					// ...and capture the result
					dataPriv.set( this, type, jQuery.event.trigger(
						saved[ 0 ],
						saved.slice( 1 ),
						this
					) );

					// Abort handling of the native event by all jQuery handlers while allowing
					// native handlers on the same element to run. On target, this is achieved
					// by stopping immediate propagation just on the jQuery event. However,
					// the native event is re-wrapped by a jQuery one on each level of the
					// propagation so the only way to stop it for jQuery is to stop it for
					// everyone via native `stopPropagation()`. This is not a problem for
					// focus/blur which don't bubble, but it does also stop click on checkboxes
					// and radios. We accept this limitation.
					event.stopPropagation();
					event.isImmediatePropagationStopped = returnTrue;
				}
			}
		} );
	}

	jQuery.removeEvent = function( elem, type, handle ) {

		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	};

	jQuery.Event = function( src, props ) {

		// Allow instantiation without the 'new' keyword
		if ( !( this instanceof jQuery.Event ) ) {
			return new jQuery.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = src.defaultPrevented ||
			src.defaultPrevented === undefined &&

			// Support: Android <=2.3 only
			src.returnValue === false ?
				returnTrue :
				returnFalse;

			// Create target properties
			// Support: Safari <=6 - 7 only
			// Target should not be a text node (trac-504, trac-13143)
			this.target = ( src.target && src.target.nodeType === 3 ) ?
				src.target.parentNode :
				src.target;

			this.currentTarget = src.currentTarget;
			this.relatedTarget = src.relatedTarget;

			// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || Date.now();

		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		constructor: jQuery.Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,
		isSimulated: false,

		preventDefault: function() {
			var e = this.originalEvent;

			this.isDefaultPrevented = returnTrue;

			if ( e && !this.isSimulated ) {
				e.preventDefault();
			}
		},
		stopPropagation: function() {
			var e = this.originalEvent;

			this.isPropagationStopped = returnTrue;

			if ( e && !this.isSimulated ) {
				e.stopPropagation();
			}
		},
		stopImmediatePropagation: function() {
			var e = this.originalEvent;

			this.isImmediatePropagationStopped = returnTrue;

			if ( e && !this.isSimulated ) {
				e.stopImmediatePropagation();
			}

			this.stopPropagation();
		}
	};

// Includes all common event props including KeyEvent and MouseEvent specific props
	jQuery.each( {
		altKey: true,
		bubbles: true,
		cancelable: true,
		changedTouches: true,
		ctrlKey: true,
		detail: true,
		eventPhase: true,
		metaKey: true,
		pageX: true,
		pageY: true,
		shiftKey: true,
		view: true,
		"char": true,
		code: true,
		charCode: true,
		key: true,
		keyCode: true,
		button: true,
		buttons: true,
		clientX: true,
		clientY: true,
		offsetX: true,
		offsetY: true,
		pointerId: true,
		pointerType: true,
		screenX: true,
		screenY: true,
		targetTouches: true,
		toElement: true,
		touches: true,
		which: true
	}, jQuery.event.addProp );

	jQuery.each( { focus: "focusin", blur: "focusout" }, function( type, delegateType ) {

		function focusMappedHandler( nativeEvent ) {
			if ( document.documentMode ) {

				// Support: IE 11+
				// Attach a single focusin/focusout handler on the document while someone wants
				// focus/blur. This is because the former are synchronous in IE while the latter
				// are async. In other browsers, all those handlers are invoked synchronously.

				// `handle` from private data would already wrap the event, but we need
				// to change the `type` here.
				var handle = dataPriv.get( this, "handle" ),
					event = jQuery.event.fix( nativeEvent );
				event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
				event.isSimulated = true;

				// First, handle focusin/focusout
				handle( nativeEvent );

				// ...then, handle focus/blur
				//
				// focus/blur don't bubble while focusin/focusout do; simulate the former by only
				// invoking the handler at the lower level.
				if ( event.target === event.currentTarget ) {

					// The setup part calls `leverageNative`, which, in turn, calls
					// `jQuery.event.add`, so event handle will already have been set
					// by this point.
					handle( event );
				}
			} else {

				// For non-IE browsers, attach a single capturing handler on the document
				// while someone wants focusin/focusout.
				jQuery.event.simulate( delegateType, nativeEvent.target,
					jQuery.event.fix( nativeEvent ) );
			}
		}

		jQuery.event.special[ type ] = {

			// Utilize native event if possible so blur/focus sequence is correct
			setup: function() {

				var attaches;

				// Claim the first handler
				// dataPriv.set( this, "focus", ... )
				// dataPriv.set( this, "blur", ... )
				leverageNative( this, type, true );

				if ( document.documentMode ) {

					// Support: IE 9 - 11+
					// We use the same native handler for focusin & focus (and focusout & blur)
					// so we need to coordinate setup & teardown parts between those events.
					// Use `delegateType` as the key as `type` is already used by `leverageNative`.
					attaches = dataPriv.get( this, delegateType );
					if ( !attaches ) {
						this.addEventListener( delegateType, focusMappedHandler );
					}
					dataPriv.set( this, delegateType, ( attaches || 0 ) + 1 );
				} else {

					// Return false to allow normal processing in the caller
					return false;
				}
			},
			trigger: function() {

				// Force setup before trigger
				leverageNative( this, type );

				// Return non-false to allow normal event-path propagation
				return true;
			},

			teardown: function() {
				var attaches;

				if ( document.documentMode ) {
					attaches = dataPriv.get( this, delegateType ) - 1;
					if ( !attaches ) {
						this.removeEventListener( delegateType, focusMappedHandler );
						dataPriv.remove( this, delegateType );
					} else {
						dataPriv.set( this, delegateType, attaches );
					}
				} else {

					// Return false to indicate standard teardown should be applied
					return false;
				}
			},

			// Suppress native focus or blur if we're currently inside
			// a leveraged native-event stack
			_default: function( event ) {
				return dataPriv.get( event.target, type );
			},

			delegateType: delegateType
		};

		// Support: Firefox <=44
		// Firefox doesn't have focus(in | out) events
		// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
		//
		// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
		// focus(in | out) events fire after focus & blur events,
		// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
		// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
		//
		// Support: IE 9 - 11+
		// To preserve relative focusin/focus & focusout/blur event order guaranteed on the 3.x branch,
		// attach a single handler for both events in IE.
		jQuery.event.special[ delegateType ] = {
			setup: function() {

				// Handle: regular nodes (via `this.ownerDocument`), window
				// (via `this.document`) & document (via `this`).
				var doc = this.ownerDocument || this.document || this,
					dataHolder = document.documentMode ? this : doc,
					attaches = dataPriv.get( dataHolder, delegateType );

				// Support: IE 9 - 11+
				// We use the same native handler for focusin & focus (and focusout & blur)
				// so we need to coordinate setup & teardown parts between those events.
				// Use `delegateType` as the key as `type` is already used by `leverageNative`.
				if ( !attaches ) {
					if ( document.documentMode ) {
						this.addEventListener( delegateType, focusMappedHandler );
					} else {
						doc.addEventListener( type, focusMappedHandler, true );
					}
				}
				dataPriv.set( dataHolder, delegateType, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this.document || this,
					dataHolder = document.documentMode ? this : doc,
					attaches = dataPriv.get( dataHolder, delegateType ) - 1;

				if ( !attaches ) {
					if ( document.documentMode ) {
						this.removeEventListener( delegateType, focusMappedHandler );
					} else {
						doc.removeEventListener( type, focusMappedHandler, true );
					}
					dataPriv.remove( dataHolder, delegateType );
				} else {
					dataPriv.set( dataHolder, delegateType, attaches );
				}
			}
		};
	} );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
	jQuery.each( {
		mouseenter: "mouseover",
		mouseleave: "mouseout",
		pointerenter: "pointerover",
		pointerleave: "pointerout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,

			handle: function( event ) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;

				// For mouseenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	} );

	jQuery.fn.extend( {

		on: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn );
		},
		one: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {

				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ?
						handleObj.origType + "." + handleObj.namespace :
						handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {

				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {

				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each( function() {
				jQuery.event.remove( this, types, fn, selector );
			} );
		}
	} );


	var

		// Support: IE <=10 - 11, Edge 12 - 13 only
		// In IE/Edge using regex groups here causes severe slowdowns.
		// See https://connect.microsoft.com/IE/feedback/details/1736512/
		rnoInnerhtml = /<script|<style|<link/i,

		// checked="checked" or checked
		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,

		rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
	function manipulationTarget( elem, content ) {
		if ( nodeName( elem, "table" ) &&
			nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

			return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
		}

		return elem;
	}

// Replace/restore the type attribute of script elements for safe DOM manipulation
	function disableScript( elem ) {
		elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
		return elem;
	}
	function restoreScript( elem ) {
		if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
			elem.type = elem.type.slice( 5 );
		} else {
			elem.removeAttribute( "type" );
		}

		return elem;
	}

	function cloneCopyEvent( src, dest ) {
		var i, l, type, pdataOld, udataOld, udataCur, events;

		if ( dest.nodeType !== 1 ) {
			return;
		}

		// 1. Copy private data: events, handlers, etc.
		if ( dataPriv.hasData( src ) ) {
			pdataOld = dataPriv.get( src );
			events = pdataOld.events;

			if ( events ) {
				dataPriv.remove( dest, "handle events" );

				for ( type in events ) {
					for ( i = 0, l = events[ type ].length; i < l; i++ ) {
						jQuery.event.add( dest, type, events[ type ][ i ] );
					}
				}
			}
		}

		// 2. Copy user data
		if ( dataUser.hasData( src ) ) {
			udataOld = dataUser.access( src );
			udataCur = jQuery.extend( {}, udataOld );

			dataUser.set( dest, udataCur );
		}
	}

// Fix IE bugs, see support tests
	function fixInput( src, dest ) {
		var nodeName = dest.nodeName.toLowerCase();

		// Fails to persist the checked state of a cloned checkbox or radio button.
		if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
			dest.checked = src.checked;

			// Fails to return the selected option to the default selected state when cloning options
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;
		}
	}

	function domManip( collection, args, callback, ignored ) {

		// Flatten any nested arrays
		args = flat( args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = collection.length,
			iNoClone = l - 1,
			value = args[ 0 ],
			valueIsFunction = isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
			return collection.each( function( index ) {
				var self = collection.eq( index );
				if ( valueIsFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				domManip( self, args, callback, ignored );
			} );
		}

		if ( l ) {
			fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			// Require either new content or an interest in ignored elements to invoke the callback
			if ( first || ignored ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item
				// instead of the first because it can end up
				// being emptied incorrectly in certain situations (trac-8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {

							// Support: Android <=4.0 only, PhantomJS 1 only
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( collection[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Re-enable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!dataPriv.access( node, "globalEval" ) &&
							jQuery.contains( doc, node ) ) {

							if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl && !node.noModule ) {
									jQuery._evalUrl( node.src, {
										nonce: node.nonce || node.getAttribute( "nonce" )
									}, doc );
								}
							} else {

								// Unwrap a CDATA section containing script contents. This shouldn't be
								// needed as in XML documents they're already not visible when
								// inspecting element contents and in HTML documents they have no
								// meaning but we're preserving that logic for backwards compatibility.
								// This will be removed completely in 4.0. See gh-4904.
								DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
							}
						}
					}
				}
			}
		}

		return collection;
	}

	function remove( elem, selector, keepData ) {
		var node,
			nodes = selector ? jQuery.filter( selector, elem ) : elem,
			i = 0;

		for ( ; ( node = nodes[ i ] ) != null; i++ ) {
			if ( !keepData && node.nodeType === 1 ) {
				jQuery.cleanData( getAll( node ) );
			}

			if ( node.parentNode ) {
				if ( keepData && isAttached( node ) ) {
					setGlobalEval( getAll( node, "script" ) );
				}
				node.parentNode.removeChild( node );
			}
		}

		return elem;
	}

	jQuery.extend( {
		htmlPrefilter: function( html ) {
			return html;
		},

		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var i, l, srcElements, destElements,
				clone = elem.cloneNode( true ),
				inPage = isAttached( elem );

			// Fix IE cloning issues
			if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

				// We eschew jQuery#find here for performance reasons:
				// https://jsperf.com/getall-vs-sizzle/2
				destElements = getAll( clone );
				srcElements = getAll( elem );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					fixInput( srcElements[ i ], destElements[ i ] );
				}
			}

			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				if ( deepDataAndEvents ) {
					srcElements = srcElements || getAll( elem );
					destElements = destElements || getAll( clone );

					for ( i = 0, l = srcElements.length; i < l; i++ ) {
						cloneCopyEvent( srcElements[ i ], destElements[ i ] );
					}
				} else {
					cloneCopyEvent( elem, clone );
				}
			}

			// Preserve script evaluation history
			destElements = getAll( clone, "script" );
			if ( destElements.length > 0 ) {
				setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
			}

			// Return the cloned set
			return clone;
		},

		cleanData: function( elems ) {
			var data, elem, type,
				special = jQuery.event.special,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				if ( acceptData( elem ) ) {
					if ( ( data = elem[ dataPriv.expando ] ) ) {
						if ( data.events ) {
							for ( type in data.events ) {
								if ( special[ type ] ) {
									jQuery.event.remove( elem, type );

									// This is a shortcut to avoid jQuery.event.remove's overhead
								} else {
									jQuery.removeEvent( elem, type, data.handle );
								}
							}
						}

						// Support: Chrome <=35 - 45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataPriv.expando ] = undefined;
					}
					if ( elem[ dataUser.expando ] ) {

						// Support: Chrome <=35 - 45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataUser.expando ] = undefined;
					}
				}
			}
		}
	} );

	jQuery.fn.extend( {
		detach: function( selector ) {
			return remove( this, selector, true );
		},

		remove: function( selector ) {
			return remove( this, selector );
		},

		text: function( value ) {
			return access( this, function( value ) {
				return value === undefined ?
					jQuery.text( this ) :
					this.empty().each( function() {
						if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
							this.textContent = value;
						}
					} );
			}, null, value, arguments.length );
		},

		append: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.appendChild( elem );
				}
			} );
		},

		prepend: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.insertBefore( elem, target.firstChild );
				}
			} );
		},

		before: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this );
				}
			} );
		},

		after: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				}
			} );
		},

		empty: function() {
			var elem,
				i = 0;

			for ( ; ( elem = this[ i ] ) != null; i++ ) {
				if ( elem.nodeType === 1 ) {

					// Prevent memory leaks
					jQuery.cleanData( getAll( elem, false ) );

					// Remove any remaining nodes
					elem.textContent = "";
				}
			}

			return this;
		},

		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

			return this.map( function() {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			} );
		},

		html: function( value ) {
			return access( this, function( value ) {
				var elem = this[ 0 ] || {},
					i = 0,
					l = this.length;

				if ( value === undefined && elem.nodeType === 1 ) {
					return elem.innerHTML;
				}

				// See if we can take a shortcut and just use innerHTML
				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
					!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

					value = jQuery.htmlPrefilter( value );

					try {
						for ( ; i < l; i++ ) {
							elem = this[ i ] || {};

							// Remove element nodes and prevent memory leaks
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( getAll( elem, false ) );
								elem.innerHTML = value;
							}
						}

						elem = 0;

						// If using innerHTML throws an exception, use the fallback method
					} catch ( e ) {}
				}

				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},

		replaceWith: function() {
			var ignored = [];

			// Make the changes, replacing each non-ignored context element with the new content
			return domManip( this, arguments, function( elem ) {
				var parent = this.parentNode;

				if ( jQuery.inArray( this, ignored ) < 0 ) {
					jQuery.cleanData( getAll( this ) );
					if ( parent ) {
						parent.replaceChild( elem, this );
					}
				}

				// Force callback invocation
			}, ignored );
		}
	} );

	jQuery.each( {
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var elems,
				ret = [],
				insert = jQuery( selector ),
				last = insert.length - 1,
				i = 0;

			for ( ; i <= last; i++ ) {
				elems = i === last ? this : this.clone( true );
				jQuery( insert[ i ] )[ original ]( elems );

				// Support: Android <=4.0 only, PhantomJS 1 only
				// .get() because push.apply(_, arraylike) throws on ancient WebKit
				push.apply( ret, elems.get() );
			}

			return this.pushStack( ret );
		};
	} );
	var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

	var rcustomProp = /^--/;


	var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (trac-15098, trac-14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

	var swap = function( elem, options, callback ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.call( elem );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	};


	var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



	( function() {

		// Executing both pixelPosition & boxSizingReliable tests require only one layout
		// so they're executed at the same time to save the second computation.
		function computeStyleTests() {

			// This is a singleton, we need to execute it only once
			if ( !div ) {
				return;
			}

			container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
				"margin-top:1px;padding:0;border:0";
			div.style.cssText =
				"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
				"margin:auto;border:1px;padding:1px;" +
				"width:60%;top:1%";
			documentElement.appendChild( container ).appendChild( div );

			var divStyle = window.getComputedStyle( div );
			pixelPositionVal = divStyle.top !== "1%";

			// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
			reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

			// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
			// Some styles come back with percentage values, even though they shouldn't
			div.style.right = "60%";
			pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

			// Support: IE 9 - 11 only
			// Detect misreporting of content dimensions for box-sizing:border-box elements
			boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

			// Support: IE 9 only
			// Detect overflow:scroll screwiness (gh-3699)
			// Support: Chrome <=64
			// Don't get tricked when zoom affects offsetWidth (gh-4029)
			div.style.position = "absolute";
			scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

			documentElement.removeChild( container );

			// Nullify the div so it wouldn't be stored in the memory and
			// it will also be a sign that checks already performed
			div = null;
		}

		function roundPixelMeasures( measure ) {
			return Math.round( parseFloat( measure ) );
		}

		var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
			reliableTrDimensionsVal, reliableMarginLeftVal,
			container = document.createElement( "div" ),
			div = document.createElement( "div" );

		// Finish early in limited (non-browser) environments
		if ( !div.style ) {
			return;
		}

		// Support: IE <=9 - 11 only
		// Style of cloned element affects source element cloned (trac-8908)
		div.style.backgroundClip = "content-box";
		div.cloneNode( true ).style.backgroundClip = "";
		support.clearCloneStyle = div.style.backgroundClip === "content-box";

		jQuery.extend( support, {
			boxSizingReliable: function() {
				computeStyleTests();
				return boxSizingReliableVal;
			},
			pixelBoxStyles: function() {
				computeStyleTests();
				return pixelBoxStylesVal;
			},
			pixelPosition: function() {
				computeStyleTests();
				return pixelPositionVal;
			},
			reliableMarginLeft: function() {
				computeStyleTests();
				return reliableMarginLeftVal;
			},
			scrollboxSize: function() {
				computeStyleTests();
				return scrollboxSizeVal;
			},

			// Support: IE 9 - 11+, Edge 15 - 18+
			// IE/Edge misreport `getComputedStyle` of table rows with width/height
			// set in CSS while `offset*` properties report correct values.
			// Behavior in IE 9 is more subtle than in newer versions & it passes
			// some versions of this test; make sure not to make it pass there!
			//
			// Support: Firefox 70+
			// Only Firefox includes border widths
			// in computed dimensions. (gh-4529)
			reliableTrDimensions: function() {
				var table, tr, trChild, trStyle;
				if ( reliableTrDimensionsVal == null ) {
					table = document.createElement( "table" );
					tr = document.createElement( "tr" );
					trChild = document.createElement( "div" );

					table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
					tr.style.cssText = "box-sizing:content-box;border:1px solid";

					// Support: Chrome 86+
					// Height set through cssText does not get applied.
					// Computed height then comes back as 0.
					tr.style.height = "1px";
					trChild.style.height = "9px";

					// Support: Android 8 Chrome 86+
					// In our bodyBackground.html iframe,
					// display for all div elements is set to "inline",
					// which causes a problem only in Android 8 Chrome 86.
					// Ensuring the div is `display: block`
					// gets around this issue.
					trChild.style.display = "block";

					documentElement
						.appendChild( table )
						.appendChild( tr )
						.appendChild( trChild );

					trStyle = window.getComputedStyle( tr );
					reliableTrDimensionsVal = ( parseInt( trStyle.height, 10 ) +
						parseInt( trStyle.borderTopWidth, 10 ) +
						parseInt( trStyle.borderBottomWidth, 10 ) ) === tr.offsetHeight;

					documentElement.removeChild( table );
				}
				return reliableTrDimensionsVal;
			}
		} );
	} )();


	function curCSS( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			isCustomProp = rcustomProp.test( name ),

			// Support: Firefox 51+
			// Retrieving style before computed somehow
			// fixes an issue with getting wrong values
			// on detached elements
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is needed for:
		//   .css('filter') (IE 9 only, trac-12537)
		//   .css('--customProperty) (gh-3144)
		if ( computed ) {

			// Support: IE <=9 - 11+
			// IE only supports `"float"` in `getPropertyValue`; in computed styles
			// it's only available as `"cssFloat"`. We no longer modify properties
			// sent to `.css()` apart from camelCasing, so we need to check both.
			// Normally, this would create difference in behavior: if
			// `getPropertyValue` returns an empty string, the value returned
			// by `.css()` would be `undefined`. This is usually the case for
			// disconnected elements. However, in IE even disconnected elements
			// with no styles return `"none"` for `getPropertyValue( "float" )`
			ret = computed.getPropertyValue( name ) || computed[ name ];

			if ( isCustomProp && ret ) {

				// Support: Firefox 105+, Chrome <=105+
				// Spec requires trimming whitespace for custom properties (gh-4926).
				// Firefox only trims leading whitespace. Chrome just collapses
				// both leading & trailing whitespace to a single space.
				//
				// Fall back to `undefined` if empty string returned.
				// This collapses a missing definition with property defined
				// and set to an empty string but there's no standard API
				// allowing us to differentiate them without a performance penalty
				// and returning `undefined` aligns with older jQuery.
				//
				// rtrimCSS treats U+000D CARRIAGE RETURN and U+000C FORM FEED
				// as whitespace while CSS does not, but this is not a problem
				// because CSS preprocessing replaces them with U+000A LINE FEED
				// (which *is* CSS whitespace)
				// https://www.w3.org/TR/css-syntax-3/#input-preprocessing
				ret = ret.replace( rtrimCSS, "$1" ) || undefined;
			}

			if ( ret === "" && !isAttached( elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Android Browser returns percentage for some values,
			// but width seems to be reliably pixels.
			// This is against the CSSOM draft spec:
			// https://drafts.csswg.org/cssom/#resolved-values
			if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret !== undefined ?

			// Support: IE <=9 - 11 only
			// IE returns zIndex value as an integer.
			ret + "" :
			ret;
	}


	function addGetHookIf( conditionFn, hookFn ) {

		// Define the hook, we'll check on the first run if it's really needed.
		return {
			get: function() {
				if ( conditionFn() ) {

					// Hook not needed (or it's not possible to use it due
					// to missing dependency), remove it.
					delete this.get;
					return;
				}

				// Hook needed; redefine it so that the support test is not executed again.
				return ( this.get = hookFn ).apply( this, arguments );
			}
		};
	}


	var cssPrefixes = [ "Webkit", "Moz", "ms" ],
		emptyStyle = document.createElement( "div" ).style,
		vendorProps = {};

// Return a vendor-prefixed property or undefined
	function vendorPropName( name ) {

		// Check for vendor prefixed names
		var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
			i = cssPrefixes.length;

		while ( i-- ) {
			name = cssPrefixes[ i ] + capName;
			if ( name in emptyStyle ) {
				return name;
			}
		}
	}

// Return a potentially-mapped jQuery.cssProps or vendor prefixed property
	function finalPropName( name ) {
		var final = jQuery.cssProps[ name ] || vendorProps[ name ];

		if ( final ) {
			return final;
		}
		if ( name in emptyStyle ) {
			return name;
		}
		return vendorProps[ name ] = vendorPropName( name ) || name;
	}


	var

		// Swappable if display is none or starts with table
		// except "table", "table-cell", or "table-caption"
		// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
		rdisplayswap = /^(none|table(?!-c[ea]).+)/,
		cssShow = { position: "absolute", visibility: "hidden", display: "block" },
		cssNormalTransform = {
			letterSpacing: "0",
			fontWeight: "400"
		};

	function setPositiveNumber( _elem, value, subtract ) {

		// Any relative (+/-) values have already been
		// normalized at this point
		var matches = rcssNum.exec( value );
		return matches ?

			// Guard against undefined "subtract", e.g., when used as in cssHooks
			Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
			value;
	}

	function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
		var i = dimension === "width" ? 1 : 0,
			extra = 0,
			delta = 0,
			marginDelta = 0;

		// Adjustment may not be necessary
		if ( box === ( isBorderBox ? "border" : "content" ) ) {
			return 0;
		}

		for ( ; i < 4; i += 2 ) {

			// Both box models exclude margin
			// Count margin delta separately to only add it after scroll gutter adjustment.
			// This is needed to make negative margins work with `outerHeight( true )` (gh-3982).
			if ( box === "margin" ) {
				marginDelta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
			}

			// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
			if ( !isBorderBox ) {

				// Add padding
				delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

				// For "border" or "margin", add border
				if ( box !== "padding" ) {
					delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

					// But still keep track of it otherwise
				} else {
					extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}

				// If we get here with a border-box (content + padding + border), we're seeking "content" or
				// "padding" or "margin"
			} else {

				// For "content", subtract padding
				if ( box === "content" ) {
					delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				}

				// For "content" or "padding", subtract border
				if ( box !== "margin" ) {
					delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			}
		}

		// Account for positive content-box scroll gutter when requested by providing computedVal
		if ( !isBorderBox && computedVal >= 0 ) {

			// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
			// Assuming integer scroll gutter, subtract the rest and round down
			delta += Math.max( 0, Math.ceil(
				elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
				computedVal -
				delta -
				extra -
				0.5

				// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
				// Use an explicit zero to avoid NaN (gh-3964)
			) ) || 0;
		}

		return delta + marginDelta;
	}

	function getWidthOrHeight( elem, dimension, extra ) {

		// Start with computed style
		var styles = getStyles( elem ),

			// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
			// Fake content-box until we know it's needed to know the true value.
			boxSizingNeeded = !support.boxSizingReliable() || extra,
			isBorderBox = boxSizingNeeded &&
				jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
			valueIsBorderBox = isBorderBox,

			val = curCSS( elem, dimension, styles ),
			offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

		// Support: Firefox <=54
		// Return a confounding non-pixel value or feign ignorance, as appropriate.
		if ( rnumnonpx.test( val ) ) {
			if ( !extra ) {
				return val;
			}
			val = "auto";
		}


		// Support: IE 9 - 11 only
		// Use offsetWidth/offsetHeight for when box sizing is unreliable.
		// In those cases, the computed value can be trusted to be border-box.
		if ( ( !support.boxSizingReliable() && isBorderBox ||

				// Support: IE 10 - 11+, Edge 15 - 18+
				// IE/Edge misreport `getComputedStyle` of table rows with width/height
				// set in CSS while `offset*` properties report correct values.
				// Interestingly, in some cases IE 9 doesn't suffer from this issue.
				!support.reliableTrDimensions() && nodeName( elem, "tr" ) ||

				// Fall back to offsetWidth/offsetHeight when value is "auto"
				// This happens for inline elements with no explicit setting (gh-3571)
				val === "auto" ||

				// Support: Android <=4.1 - 4.3 only
				// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
				!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&

			// Make sure the element is visible & connected
			elem.getClientRects().length ) {

			isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

			// Where available, offsetWidth/offsetHeight approximate border box dimensions.
			// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
			// retrieved value as a content box dimension.
			valueIsBorderBox = offsetProp in elem;
			if ( valueIsBorderBox ) {
				val = elem[ offsetProp ];
			}
		}

		// Normalize "" and auto
		val = parseFloat( val ) || 0;

		// Adjust for the element's box model
		return ( val +
			boxModelAdjustment(
				elem,
				dimension,
				extra || ( isBorderBox ? "border" : "content" ),
				valueIsBorderBox,
				styles,

				// Provide the current computed size to request scroll gutter calculation (gh-3589)
				val
			)
		) + "px";
	}

	jQuery.extend( {

		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {

						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;
					}
				}
			}
		},

		// Don't automatically add "px" to these possibly-unitless properties
		cssNumber: {
			animationIterationCount: true,
			aspectRatio: true,
			borderImageSlice: true,
			columnCount: true,
			flexGrow: true,
			flexShrink: true,
			fontWeight: true,
			gridArea: true,
			gridColumn: true,
			gridColumnEnd: true,
			gridColumnStart: true,
			gridRow: true,
			gridRowEnd: true,
			gridRowStart: true,
			lineHeight: true,
			opacity: true,
			order: true,
			orphans: true,
			scale: true,
			widows: true,
			zIndex: true,
			zoom: true,

			// SVG-related
			fillOpacity: true,
			floodOpacity: true,
			stopOpacity: true,
			strokeMiterlimit: true,
			strokeOpacity: true
		},

		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {},

		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {

			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}

			// Make sure that we're working with the right name
			var ret, type, hooks,
				origName = camelCase( name ),
				isCustomProp = rcustomProp.test( name ),
				style = elem.style;

			// Make sure that we're working with the right name. We don't
			// want to query the value if it is a CSS custom property
			// since they are user-defined.
			if ( !isCustomProp ) {
				name = finalPropName( origName );
			}

			// Gets hook for the prefixed version, then unprefixed version
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;

				// Convert "+=" or "-=" to relative numbers (trac-7345)
				if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
					value = adjustCSS( elem, name, ret );

					// Fixes bug trac-9237
					type = "number";
				}

				// Make sure that null and NaN values aren't set (trac-7116)
				if ( value == null || value !== value ) {
					return;
				}

				// If a number was passed in, add the unit (except for certain CSS properties)
				// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
				// "px" to a few hardcoded values.
				if ( type === "number" && !isCustomProp ) {
					value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
				}

				// background-* props affect original clone's values
				if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
					style[ name ] = "inherit";
				}

				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !( "set" in hooks ) ||
					( value = hooks.set( elem, value, extra ) ) !== undefined ) {

					if ( isCustomProp ) {
						style.setProperty( name, value );
					} else {
						style[ name ] = value;
					}
				}

			} else {

				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks &&
					( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

					return ret;
				}

				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},

		css: function( elem, name, extra, styles ) {
			var val, num, hooks,
				origName = camelCase( name ),
				isCustomProp = rcustomProp.test( name );

			// Make sure that we're working with the right name. We don't
			// want to modify the value if it is a CSS custom property
			// since they are user-defined.
			if ( !isCustomProp ) {
				name = finalPropName( origName );
			}

			// Try prefixed name followed by the unprefixed name
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks ) {
				val = hooks.get( elem, true, extra );
			}

			// Otherwise, if a way to get the computed value exists, use that
			if ( val === undefined ) {
				val = curCSS( elem, name, styles );
			}

			// Convert "normal" to computed value
			if ( val === "normal" && name in cssNormalTransform ) {
				val = cssNormalTransform[ name ];
			}

			// Make numeric if forced or a qualifier was provided and val looks numeric
			if ( extra === "" || extra ) {
				num = parseFloat( val );
				return extra === true || isFinite( num ) ? num || 0 : val;
			}

			return val;
		}
	} );

	jQuery.each( [ "height", "width" ], function( _i, dimension ) {
		jQuery.cssHooks[ dimension ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {

					// Certain elements can have dimension info if we invisibly show them
					// but it must have a current display style that would benefit
					return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
				}
			},

			set: function( elem, value, extra ) {
				var matches,
					styles = getStyles( elem ),

					// Only read styles.position if the test has a chance to fail
					// to avoid forcing a reflow.
					scrollboxSizeBuggy = !support.scrollboxSize() &&
						styles.position === "absolute",

					// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
					boxSizingNeeded = scrollboxSizeBuggy || extra,
					isBorderBox = boxSizingNeeded &&
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					subtract = extra ?
						boxModelAdjustment(
							elem,
							dimension,
							extra,
							isBorderBox,
							styles
						) :
						0;

				// Account for unreliable border-box dimensions by comparing offset* to computed and
				// faking a content-box to get border and padding (gh-3699)
				if ( isBorderBox && scrollboxSizeBuggy ) {
					subtract -= Math.ceil(
						elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
						parseFloat( styles[ dimension ] ) -
						boxModelAdjustment( elem, dimension, "border", false, styles ) -
						0.5
					);
				}

				// Convert to pixels if value adjustment is needed
				if ( subtract && ( matches = rcssNum.exec( value ) ) &&
					( matches[ 3 ] || "px" ) !== "px" ) {

					elem.style[ dimension ] = value;
					value = jQuery.css( elem, dimension );
				}

				return setPositiveNumber( elem, value, subtract );
			}
		};
	} );

	jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
		function( elem, computed ) {
			if ( computed ) {
				return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
					elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
			}
		}
	);

// These hooks are used by animate to expand properties
	jQuery.each( {
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {
		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i = 0,
					expanded = {},

					// Assumes a single number if not a string
					parts = typeof value === "string" ? value.split( " " ) : [ value ];

				for ( ; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
						parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}

				return expanded;
			}
		};

		if ( prefix !== "margin" ) {
			jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
		}
	} );

	jQuery.fn.extend( {
		css: function( name, value ) {
			return access( this, function( elem, name, value ) {
				var styles, len,
					map = {},
					i = 0;

				if ( Array.isArray( name ) ) {
					styles = getStyles( elem );
					len = name.length;

					for ( ; i < len; i++ ) {
						map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
					}

					return map;
				}

				return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
			}, name, value, arguments.length > 1 );
		}
	} );


	function Tween( elem, options, prop, end, easing ) {
		return new Tween.prototype.init( elem, options, prop, end, easing );
	}
	jQuery.Tween = Tween;

	Tween.prototype = {
		constructor: Tween,
		init: function( elem, options, prop, end, easing, unit ) {
			this.elem = elem;
			this.prop = prop;
			this.easing = easing || jQuery.easing._default;
			this.options = options;
			this.start = this.now = this.cur();
			this.end = end;
			this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		},
		cur: function() {
			var hooks = Tween.propHooks[ this.prop ];

			return hooks && hooks.get ?
				hooks.get( this ) :
				Tween.propHooks._default.get( this );
		},
		run: function( percent ) {
			var eased,
				hooks = Tween.propHooks[ this.prop ];

			if ( this.options.duration ) {
				this.pos = eased = jQuery.easing[ this.easing ](
					percent, this.options.duration * percent, 0, 1, this.options.duration
				);
			} else {
				this.pos = eased = percent;
			}
			this.now = ( this.end - this.start ) * eased + this.start;

			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}

			if ( hooks && hooks.set ) {
				hooks.set( this );
			} else {
				Tween.propHooks._default.set( this );
			}
			return this;
		}
	};

	Tween.prototype.init.prototype = Tween.prototype;

	Tween.propHooks = {
		_default: {
			get: function( tween ) {
				var result;

				// Use a property on the element directly when it is not a DOM element,
				// or when there is no matching style property that exists.
				if ( tween.elem.nodeType !== 1 ||
					tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
					return tween.elem[ tween.prop ];
				}

				// Passing an empty string as a 3rd parameter to .css will automatically
				// attempt a parseFloat and fallback to a string if the parse fails.
				// Simple values such as "10px" are parsed to Float;
				// complex values such as "rotate(1rad)" are returned as-is.
				result = jQuery.css( tween.elem, tween.prop, "" );

				// Empty strings, null, undefined and "auto" are converted to 0.
				return !result || result === "auto" ? 0 : result;
			},
			set: function( tween ) {

				// Use step hook for back compat.
				// Use cssHook if its there.
				// Use .style if available and use plain properties where available.
				if ( jQuery.fx.step[ tween.prop ] ) {
					jQuery.fx.step[ tween.prop ]( tween );
				} else if ( tween.elem.nodeType === 1 && (
					jQuery.cssHooks[ tween.prop ] ||
					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
					jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
				} else {
					tween.elem[ tween.prop ] = tween.now;
				}
			}
		}
	};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
	Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
		set: function( tween ) {
			if ( tween.elem.nodeType && tween.elem.parentNode ) {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	};

	jQuery.easing = {
		linear: function( p ) {
			return p;
		},
		swing: function( p ) {
			return 0.5 - Math.cos( p * Math.PI ) / 2;
		},
		_default: "swing"
	};

	jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
	jQuery.fx.step = {};




	var
		fxNow, inProgress,
		rfxtypes = /^(?:toggle|show|hide)$/,
		rrun = /queueHooks$/;

	function schedule() {
		if ( inProgress ) {
			if ( document.hidden === false && window.requestAnimationFrame ) {
				window.requestAnimationFrame( schedule );
			} else {
				window.setTimeout( schedule, jQuery.fx.interval );
			}

			jQuery.fx.tick();
		}
	}

// Animations created synchronously will run synchronously
	function createFxNow() {
		window.setTimeout( function() {
			fxNow = undefined;
		} );
		return ( fxNow = Date.now() );
	}

// Generate parameters to create a standard animation
	function genFx( type, includeWidth ) {
		var which,
			i = 0,
			attrs = { height: type };

		// If we include width, step value is 1 to do all cssExpand values,
		// otherwise step value is 2 to skip over Left and Right
		includeWidth = includeWidth ? 1 : 0;
		for ( ; i < 4; i += 2 - includeWidth ) {
			which = cssExpand[ i ];
			attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
		}

		if ( includeWidth ) {
			attrs.opacity = attrs.width = type;
		}

		return attrs;
	}

	function createTween( value, prop, animation ) {
		var tween,
			collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

				// We're done with this property
				return tween;
			}
		}
	}

	function defaultPrefilter( elem, props, opts ) {
		var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
			isBox = "width" in props || "height" in props,
			anim = this,
			orig = {},
			style = elem.style,
			hidden = elem.nodeType && isHiddenWithinTree( elem ),
			dataShow = dataPriv.get( elem, "fxshow" );

		// Queue-skipping animations hijack the fx hooks
		if ( !opts.queue ) {
			hooks = jQuery._queueHooks( elem, "fx" );
			if ( hooks.unqueued == null ) {
				hooks.unqueued = 0;
				oldfire = hooks.empty.fire;
				hooks.empty.fire = function() {
					if ( !hooks.unqueued ) {
						oldfire();
					}
				};
			}
			hooks.unqueued++;

			anim.always( function() {

				// Ensure the complete handler is called before this completes
				anim.always( function() {
					hooks.unqueued--;
					if ( !jQuery.queue( elem, "fx" ).length ) {
						hooks.empty.fire();
					}
				} );
			} );
		}

		// Detect show/hide animations
		for ( prop in props ) {
			value = props[ prop ];
			if ( rfxtypes.test( value ) ) {
				delete props[ prop ];
				toggle = toggle || value === "toggle";
				if ( value === ( hidden ? "hide" : "show" ) ) {

					// Pretend to be hidden if this is a "show" and
					// there is still data from a stopped show/hide
					if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
						hidden = true;

						// Ignore all other no-op show/hide data
					} else {
						continue;
					}
				}
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
			}
		}

		// Bail out if this is a no-op like .hide().hide()
		propTween = !jQuery.isEmptyObject( props );
		if ( !propTween && jQuery.isEmptyObject( orig ) ) {
			return;
		}

		// Restrict "overflow" and "display" styles during box animations
		if ( isBox && elem.nodeType === 1 ) {

			// Support: IE <=9 - 11, Edge 12 - 15
			// Record all 3 overflow attributes because IE does not infer the shorthand
			// from identically-valued overflowX and overflowY and Edge just mirrors
			// the overflowX value there.
			opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

			// Identify a display type, preferring old show/hide data over the CSS cascade
			restoreDisplay = dataShow && dataShow.display;
			if ( restoreDisplay == null ) {
				restoreDisplay = dataPriv.get( elem, "display" );
			}
			display = jQuery.css( elem, "display" );
			if ( display === "none" ) {
				if ( restoreDisplay ) {
					display = restoreDisplay;
				} else {

					// Get nonempty value(s) by temporarily forcing visibility
					showHide( [ elem ], true );
					restoreDisplay = elem.style.display || restoreDisplay;
					display = jQuery.css( elem, "display" );
					showHide( [ elem ] );
				}
			}

			// Animate inline elements as inline-block
			if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
				if ( jQuery.css( elem, "float" ) === "none" ) {

					// Restore the original display value at the end of pure show/hide animations
					if ( !propTween ) {
						anim.done( function() {
							style.display = restoreDisplay;
						} );
						if ( restoreDisplay == null ) {
							display = style.display;
							restoreDisplay = display === "none" ? "" : display;
						}
					}
					style.display = "inline-block";
				}
			}
		}

		if ( opts.overflow ) {
			style.overflow = "hidden";
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}

		// Implement show/hide animations
		propTween = false;
		for ( prop in orig ) {

			// General show/hide setup for this element animation
			if ( !propTween ) {
				if ( dataShow ) {
					if ( "hidden" in dataShow ) {
						hidden = dataShow.hidden;
					}
				} else {
					dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
				}

				// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
				if ( toggle ) {
					dataShow.hidden = !hidden;
				}

				// Show elements before animating them
				if ( hidden ) {
					showHide( [ elem ], true );
				}

				/* eslint-disable no-loop-func */

				anim.done( function() {

					/* eslint-enable no-loop-func */

					// The final step of a "hide" animation is actually hiding the element
					if ( !hidden ) {
						showHide( [ elem ] );
					}
					dataPriv.remove( elem, "fxshow" );
					for ( prop in orig ) {
						jQuery.style( elem, prop, orig[ prop ] );
					}
				} );
			}

			// Per-property setup
			propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = propTween.start;
				if ( hidden ) {
					propTween.end = propTween.start;
					propTween.start = 0;
				}
			}
		}
	}

	function propFilter( props, specialEasing ) {
		var index, name, easing, value, hooks;

		// camelCase, specialEasing and expand cssHook pass
		for ( index in props ) {
			name = camelCase( index );
			easing = specialEasing[ name ];
			value = props[ index ];
			if ( Array.isArray( value ) ) {
				easing = value[ 1 ];
				value = props[ index ] = value[ 0 ];
			}

			if ( index !== name ) {
				props[ name ] = value;
				delete props[ index ];
			}

			hooks = jQuery.cssHooks[ name ];
			if ( hooks && "expand" in hooks ) {
				value = hooks.expand( value );
				delete props[ name ];

				// Not quite $.extend, this won't overwrite existing keys.
				// Reusing 'index' because we have the correct "name"
				for ( index in value ) {
					if ( !( index in props ) ) {
						props[ index ] = value[ index ];
						specialEasing[ index ] = easing;
					}
				}
			} else {
				specialEasing[ name ] = easing;
			}
		}
	}

	function Animation( elem, properties, options ) {
		var result,
			stopped,
			index = 0,
			length = Animation.prefilters.length,
			deferred = jQuery.Deferred().always( function() {

				// Don't match elem in the :animated selector
				delete tick.elem;
			} ),
			tick = function() {
				if ( stopped ) {
					return false;
				}
				var currentTime = fxNow || createFxNow(),
					remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

					// Support: Android 2.3 only
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (trac-12497)
					temp = remaining / animation.duration || 0,
					percent = 1 - temp,
					index = 0,
					length = animation.tweens.length;

				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( percent );
				}

				deferred.notifyWith( elem, [ animation, percent, remaining ] );

				// If there's more to do, yield
				if ( percent < 1 && length ) {
					return remaining;
				}

				// If this was an empty animation, synthesize a final progress notification
				if ( !length ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
				}

				// Resolve the animation and report its conclusion
				deferred.resolveWith( elem, [ animation ] );
				return false;
			},
			animation = deferred.promise( {
				elem: elem,
				props: jQuery.extend( {}, properties ),
				opts: jQuery.extend( true, {
					specialEasing: {},
					easing: jQuery.easing._default
				}, options ),
				originalProperties: properties,
				originalOptions: options,
				startTime: fxNow || createFxNow(),
				duration: options.duration,
				tweens: [],
				createTween: function( prop, end ) {
					var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
					animation.tweens.push( tween );
					return tween;
				},
				stop: function( gotoEnd ) {
					var index = 0,

						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
					if ( stopped ) {
						return this;
					}
					stopped = true;
					for ( ; index < length; index++ ) {
						animation.tweens[ index ].run( 1 );
					}

					// Resolve when we played the last frame; otherwise, reject
					if ( gotoEnd ) {
						deferred.notifyWith( elem, [ animation, 1, 0 ] );
						deferred.resolveWith( elem, [ animation, gotoEnd ] );
					} else {
						deferred.rejectWith( elem, [ animation, gotoEnd ] );
					}
					return this;
				}
			} ),
			props = animation.props;

		propFilter( props, animation.opts.specialEasing );

		for ( ; index < length; index++ ) {
			result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
			if ( result ) {
				if ( isFunction( result.stop ) ) {
					jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
						result.stop.bind( result );
				}
				return result;
			}
		}

		jQuery.map( props, createTween, animation );

		if ( isFunction( animation.opts.start ) ) {
			animation.opts.start.call( elem, animation );
		}

		// Attach callbacks from options
		animation
			.progress( animation.opts.progress )
			.done( animation.opts.done, animation.opts.complete )
			.fail( animation.opts.fail )
			.always( animation.opts.always );

		jQuery.fx.timer(
			jQuery.extend( tick, {
				elem: elem,
				anim: animation,
				queue: animation.opts.queue
			} )
		);

		return animation;
	}

	jQuery.Animation = jQuery.extend( Animation, {

		tweeners: {
			"*": [ function( prop, value ) {
				var tween = this.createTween( prop, value );
				adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
				return tween;
			} ]
		},

		tweener: function( props, callback ) {
			if ( isFunction( props ) ) {
				callback = props;
				props = [ "*" ];
			} else {
				props = props.match( rnothtmlwhite );
			}

			var prop,
				index = 0,
				length = props.length;

			for ( ; index < length; index++ ) {
				prop = props[ index ];
				Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
				Animation.tweeners[ prop ].unshift( callback );
			}
		},

		prefilters: [ defaultPrefilter ],

		prefilter: function( callback, prepend ) {
			if ( prepend ) {
				Animation.prefilters.unshift( callback );
			} else {
				Animation.prefilters.push( callback );
			}
		}
	} );

	jQuery.speed = function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !isFunction( easing ) && easing
		};

		// Go to the end state if fx are off
		if ( jQuery.fx.off ) {
			opt.duration = 0;

		} else {
			if ( typeof opt.duration !== "number" ) {
				if ( opt.duration in jQuery.fx.speeds ) {
					opt.duration = jQuery.fx.speeds[ opt.duration ];

				} else {
					opt.duration = jQuery.fx.speeds._default;
				}
			}
		}

		// Normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}

		// Queueing
		opt.old = opt.complete;

		opt.complete = function() {
			if ( isFunction( opt.old ) ) {
				opt.old.call( this );
			}

			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			}
		};

		return opt;
	};

	jQuery.fn.extend( {
		fadeTo: function( speed, to, easing, callback ) {

			// Show any hidden elements after setting opacity to 0
			return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

				// Animate to the value specified
				.end().animate( { opacity: to }, speed, easing, callback );
		},
		animate: function( prop, speed, easing, callback ) {
			var empty = jQuery.isEmptyObject( prop ),
				optall = jQuery.speed( speed, easing, callback ),
				doAnimation = function() {

					// Operate on a copy of prop so per-property easing won't be lost
					var anim = Animation( this, jQuery.extend( {}, prop ), optall );

					// Empty animations, or finishing resolves immediately
					if ( empty || dataPriv.get( this, "finish" ) ) {
						anim.stop( true );
					}
				};

			doAnimation.finish = doAnimation;

			return empty || optall.queue === false ?
				this.each( doAnimation ) :
				this.queue( optall.queue, doAnimation );
		},
		stop: function( type, clearQueue, gotoEnd ) {
			var stopQueue = function( hooks ) {
				var stop = hooks.stop;
				delete hooks.stop;
				stop( gotoEnd );
			};

			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue ) {
				this.queue( type || "fx", [] );
			}

			return this.each( function() {
				var dequeue = true,
					index = type != null && type + "queueHooks",
					timers = jQuery.timers,
					data = dataPriv.get( this );

				if ( index ) {
					if ( data[ index ] && data[ index ].stop ) {
						stopQueue( data[ index ] );
					}
				} else {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
							stopQueue( data[ index ] );
						}
					}
				}

				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this &&
						( type == null || timers[ index ].queue === type ) ) {

						timers[ index ].anim.stop( gotoEnd );
						dequeue = false;
						timers.splice( index, 1 );
					}
				}

				// Start the next in the queue if the last step wasn't forced.
				// Timers currently will call their complete callbacks, which
				// will dequeue but only if they were gotoEnd.
				if ( dequeue || !gotoEnd ) {
					jQuery.dequeue( this, type );
				}
			} );
		},
		finish: function( type ) {
			if ( type !== false ) {
				type = type || "fx";
			}
			return this.each( function() {
				var index,
					data = dataPriv.get( this ),
					queue = data[ type + "queue" ],
					hooks = data[ type + "queueHooks" ],
					timers = jQuery.timers,
					length = queue ? queue.length : 0;

				// Enable finishing flag on private data
				data.finish = true;

				// Empty the queue first
				jQuery.queue( this, type, [] );

				if ( hooks && hooks.stop ) {
					hooks.stop.call( this, true );
				}

				// Look for any active animations, and finish them
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
						timers[ index ].anim.stop( true );
						timers.splice( index, 1 );
					}
				}

				// Look for any animations in the old queue and finish them
				for ( index = 0; index < length; index++ ) {
					if ( queue[ index ] && queue[ index ].finish ) {
						queue[ index ].finish.call( this );
					}
				}

				// Turn off finishing flag
				delete data.finish;
			} );
		}
	} );

	jQuery.each( [ "toggle", "show", "hide" ], function( _i, name ) {
		var cssFn = jQuery.fn[ name ];
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return speed == null || typeof speed === "boolean" ?
				cssFn.apply( this, arguments ) :
				this.animate( genFx( name, true ), speed, easing, callback );
		};
	} );

// Generate shortcuts for custom animations
	jQuery.each( {
		slideDown: genFx( "show" ),
		slideUp: genFx( "hide" ),
		slideToggle: genFx( "toggle" ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	} );

	jQuery.timers = [];
	jQuery.fx.tick = function() {
		var timer,
			i = 0,
			timers = jQuery.timers;

		fxNow = Date.now();

		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];

			// Run the timer and safely remove it when done (allowing for external removal)
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
		fxNow = undefined;
	};

	jQuery.fx.timer = function( timer ) {
		jQuery.timers.push( timer );
		jQuery.fx.start();
	};

	jQuery.fx.interval = 13;
	jQuery.fx.start = function() {
		if ( inProgress ) {
			return;
		}

		inProgress = true;
		schedule();
	};

	jQuery.fx.stop = function() {
		inProgress = null;
	};

	jQuery.fx.speeds = {
		slow: 600,
		fast: 200,

		// Default speed
		_default: 400
	};


// Based off of the plugin by Clint Helfers, with permission.
	jQuery.fn.delay = function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = window.setTimeout( next, time );
			hooks.stop = function() {
				window.clearTimeout( timeout );
			};
		} );
	};


	( function() {
		var input = document.createElement( "input" ),
			select = document.createElement( "select" ),
			opt = select.appendChild( document.createElement( "option" ) );

		input.type = "checkbox";

		// Support: Android <=4.3 only
		// Default value for a checkbox should be "on"
		support.checkOn = input.value !== "";

		// Support: IE <=11 only
		// Must access selectedIndex to make default options select
		support.optSelected = opt.selected;

		// Support: IE <=11 only
		// An input loses its value after becoming a radio
		input = document.createElement( "input" );
		input.value = "t";
		input.type = "radio";
		support.radioValue = input.value === "t";
	} )();


	var boolHook,
		attrHandle = jQuery.expr.attrHandle;

	jQuery.fn.extend( {
		attr: function( name, value ) {
			return access( this, jQuery.attr, name, value, arguments.length > 1 );
		},

		removeAttr: function( name ) {
			return this.each( function() {
				jQuery.removeAttr( this, name );
			} );
		}
	} );

	jQuery.extend( {
		attr: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set attributes on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}

			// Attribute hooks are determined by the lowercase version
			// Grab necessary hook if one is defined
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
				hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
					( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
			}

			if ( value !== undefined ) {
				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;
				}

				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				elem.setAttribute( name, value + "" );
				return value;
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ? undefined : ret;
		},

		attrHooks: {
			type: {
				set: function( elem, value ) {
					if ( !support.radioValue && value === "radio" &&
						nodeName( elem, "input" ) ) {
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			}
		},

		removeAttr: function( elem, value ) {
			var name,
				i = 0,

				// Attribute names can contain non-HTML whitespace characters
				// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
				attrNames = value && value.match( rnothtmlwhite );

			if ( attrNames && elem.nodeType === 1 ) {
				while ( ( name = attrNames[ i++ ] ) ) {
					elem.removeAttribute( name );
				}
			}
		}
	} );

// Hooks for boolean attributes
	boolHook = {
		set: function( elem, value, name ) {
			if ( value === false ) {

				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				elem.setAttribute( name, name );
			}
			return name;
		}
	};

	jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( _i, name ) {
		var getter = attrHandle[ name ] || jQuery.find.attr;

		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle,
				lowercaseName = name.toLowerCase();

			if ( !isXML ) {

				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ lowercaseName ];
				attrHandle[ lowercaseName ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					lowercaseName :
					null;
				attrHandle[ lowercaseName ] = handle;
			}
			return ret;
		};
	} );




	var rfocusable = /^(?:input|select|textarea|button)$/i,
		rclickable = /^(?:a|area)$/i;

	jQuery.fn.extend( {
		prop: function( name, value ) {
			return access( this, jQuery.prop, name, value, arguments.length > 1 );
		},

		removeProp: function( name ) {
			return this.each( function() {
				delete this[ jQuery.propFix[ name ] || name ];
			} );
		}
	} );

	jQuery.extend( {
		prop: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set properties on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}

			if ( value !== undefined ) {
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				return ( elem[ name ] = value );
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			return elem[ name ];
		},

		propHooks: {
			tabIndex: {
				get: function( elem ) {

					// Support: IE <=9 - 11 only
					// elem.tabIndex doesn't always return the
					// correct value when it hasn't been explicitly set
					// Use proper attribute retrieval (trac-12072)
					var tabindex = jQuery.find.attr( elem, "tabindex" );

					if ( tabindex ) {
						return parseInt( tabindex, 10 );
					}

					if (
						rfocusable.test( elem.nodeName ) ||
						rclickable.test( elem.nodeName ) &&
						elem.href
					) {
						return 0;
					}

					return -1;
				}
			}
		},

		propFix: {
			"for": "htmlFor",
			"class": "className"
		}
	} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
	if ( !support.optSelected ) {
		jQuery.propHooks.selected = {
			get: function( elem ) {

				/* eslint no-unused-expressions: "off" */

				var parent = elem.parentNode;
				if ( parent && parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
				return null;
			},
			set: function( elem ) {

				/* eslint no-unused-expressions: "off" */

				var parent = elem.parentNode;
				if ( parent ) {
					parent.selectedIndex;

					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
			}
		};
	}

	jQuery.each( [
		"tabIndex",
		"readOnly",
		"maxLength",
		"cellSpacing",
		"cellPadding",
		"rowSpan",
		"colSpan",
		"useMap",
		"frameBorder",
		"contentEditable"
	], function() {
		jQuery.propFix[ this.toLowerCase() ] = this;
	} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


	function getClass( elem ) {
		return elem.getAttribute && elem.getAttribute( "class" ) || "";
	}

	function classesToArray( value ) {
		if ( Array.isArray( value ) ) {
			return value;
		}
		if ( typeof value === "string" ) {
			return value.match( rnothtmlwhite ) || [];
		}
		return [];
	}

	jQuery.fn.extend( {
		addClass: function( value ) {
			var classNames, cur, curValue, className, i, finalValue;

			if ( isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			classNames = classesToArray( value );

			if ( classNames.length ) {
				return this.each( function() {
					curValue = getClass( this );
					cur = this.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

					if ( cur ) {
						for ( i = 0; i < classNames.length; i++ ) {
							className = classNames[ i ];
							if ( cur.indexOf( " " + className + " " ) < 0 ) {
								cur += className + " ";
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = stripAndCollapse( cur );
						if ( curValue !== finalValue ) {
							this.setAttribute( "class", finalValue );
						}
					}
				} );
			}

			return this;
		},

		removeClass: function( value ) {
			var classNames, cur, curValue, className, i, finalValue;

			if ( isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( !arguments.length ) {
				return this.attr( "class", "" );
			}

			classNames = classesToArray( value );

			if ( classNames.length ) {
				return this.each( function() {
					curValue = getClass( this );

					// This expression is here for better compressibility (see addClass)
					cur = this.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

					if ( cur ) {
						for ( i = 0; i < classNames.length; i++ ) {
							className = classNames[ i ];

							// Remove *all* instances
							while ( cur.indexOf( " " + className + " " ) > -1 ) {
								cur = cur.replace( " " + className + " ", " " );
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = stripAndCollapse( cur );
						if ( curValue !== finalValue ) {
							this.setAttribute( "class", finalValue );
						}
					}
				} );
			}

			return this;
		},

		toggleClass: function( value, stateVal ) {
			var classNames, className, i, self,
				type = typeof value,
				isValidValue = type === "string" || Array.isArray( value );

			if ( isFunction( value ) ) {
				return this.each( function( i ) {
					jQuery( this ).toggleClass(
						value.call( this, i, getClass( this ), stateVal ),
						stateVal
					);
				} );
			}

			if ( typeof stateVal === "boolean" && isValidValue ) {
				return stateVal ? this.addClass( value ) : this.removeClass( value );
			}

			classNames = classesToArray( value );

			return this.each( function() {
				if ( isValidValue ) {

					// Toggle individual class names
					self = jQuery( this );

					for ( i = 0; i < classNames.length; i++ ) {
						className = classNames[ i ];

						// Check each className given, space separated list
						if ( self.hasClass( className ) ) {
							self.removeClass( className );
						} else {
							self.addClass( className );
						}
					}

					// Toggle whole class name
				} else if ( value === undefined || type === "boolean" ) {
					className = getClass( this );
					if ( className ) {

						// Store className if set
						dataPriv.set( this, "__className__", className );
					}

					// If the element has a class name or if we're passed `false`,
					// then remove the whole classname (if there was one, the above saved it).
					// Otherwise bring back whatever was previously saved (if anything),
					// falling back to the empty string if nothing was stored.
					if ( this.setAttribute ) {
						this.setAttribute( "class",
							className || value === false ?
								"" :
								dataPriv.get( this, "__className__" ) || ""
						);
					}
				}
			} );
		},

		hasClass: function( selector ) {
			var className, elem,
				i = 0;

			className = " " + selector + " ";
			while ( ( elem = this[ i++ ] ) ) {
				if ( elem.nodeType === 1 &&
					( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
				}
			}

			return false;
		}
	} );




	var rreturn = /\r/g;

	jQuery.fn.extend( {
		val: function( value ) {
			var hooks, ret, valueIsFunction,
				elem = this[ 0 ];

			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] ||
						jQuery.valHooks[ elem.nodeName.toLowerCase() ];

					if ( hooks &&
						"get" in hooks &&
						( ret = hooks.get( elem, "value" ) ) !== undefined
					) {
						return ret;
					}

					ret = elem.value;

					// Handle most common string cases
					if ( typeof ret === "string" ) {
						return ret.replace( rreturn, "" );
					}

					// Handle cases where value is null/undef or number
					return ret == null ? "" : ret;
				}

				return;
			}

			valueIsFunction = isFunction( value );

			return this.each( function( i ) {
				var val;

				if ( this.nodeType !== 1 ) {
					return;
				}

				if ( valueIsFunction ) {
					val = value.call( this, i, jQuery( this ).val() );
				} else {
					val = value;
				}

				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";

				} else if ( typeof val === "number" ) {
					val += "";

				} else if ( Array.isArray( val ) ) {
					val = jQuery.map( val, function( value ) {
						return value == null ? "" : value + "";
					} );
				}

				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

				// If set returns undefined, fall back to normal setting
				if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			} );
		}
	} );

	jQuery.extend( {
		valHooks: {
			option: {
				get: function( elem ) {

					var val = jQuery.find.attr( elem, "value" );
					return val != null ?
						val :

						// Support: IE <=10 - 11 only
						// option.text throws exceptions (trac-14686, trac-14858)
						// Strip and collapse whitespace
						// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
						stripAndCollapse( jQuery.text( elem ) );
				}
			},
			select: {
				get: function( elem ) {
					var value, option, i,
						options = elem.options,
						index = elem.selectedIndex,
						one = elem.type === "select-one",
						values = one ? null : [],
						max = one ? index + 1 : options.length;

					if ( index < 0 ) {
						i = max;

					} else {
						i = one ? index : 0;
					}

					// Loop through all the selected options
					for ( ; i < max; i++ ) {
						option = options[ i ];

						// Support: IE <=9 only
						// IE8-9 doesn't update selected after form reset (trac-2551)
						if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

							// Get the specific value for the option
							value = jQuery( option ).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				},

				set: function( elem, value ) {
					var optionSet, option,
						options = elem.options,
						values = jQuery.makeArray( value ),
						i = options.length;

					while ( i-- ) {
						option = options[ i ];

						/* eslint-disable no-cond-assign */

						if ( option.selected =
							jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
						) {
							optionSet = true;
						}

						/* eslint-enable no-cond-assign */
					}

					// Force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		}
	} );

// Radios and checkboxes getter/setter
	jQuery.each( [ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			set: function( elem, value ) {
				if ( Array.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
				}
			}
		};
		if ( !support.checkOn ) {
			jQuery.valHooks[ this ].get = function( elem ) {
				return elem.getAttribute( "value" ) === null ? "on" : elem.value;
			};
		}
	} );




// Return jQuery for attributes-only inclusion
	var location = window.location;

	var nonce = { guid: Date.now() };

	var rquery = ( /\?/ );



// Cross-browser xml parsing
	jQuery.parseXML = function( data ) {
		var xml, parserErrorElem;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE 9 - 11 only
		// IE throws on parseFromString with invalid input.
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {}

		parserErrorElem = xml && xml.getElementsByTagName( "parsererror" )[ 0 ];
		if ( !xml || parserErrorElem ) {
			jQuery.error( "Invalid XML: " + (
				parserErrorElem ?
					jQuery.map( parserErrorElem.childNodes, function( el ) {
						return el.textContent;
					} ).join( "\n" ) :
					data
			) );
		}
		return xml;
	};


	var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
		stopPropagationCallback = function( e ) {
			e.stopPropagation();
		};

	jQuery.extend( jQuery.event, {

		trigger: function( event, data, elem, onlyHandlers ) {

			var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
				eventPath = [ elem || document ],
				type = hasOwn.call( event, "type" ) ? event.type : event,
				namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

			cur = lastElement = tmp = elem = elem || document;

			// Don't do events on text and comment nodes
			if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
				return;
			}

			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}

			if ( type.indexOf( "." ) > -1 ) {

				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split( "." );
				type = namespaces.shift();
				namespaces.sort();
			}
			ontype = type.indexOf( ":" ) < 0 && "on" + type;

			// Caller can pass in a jQuery.Event object, Object, or just an event type string
			event = event[ jQuery.expando ] ?
				event :
				new jQuery.Event( type, typeof event === "object" && event );

			// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
			event.isTrigger = onlyHandlers ? 2 : 3;
			event.namespace = namespaces.join( "." );
			event.rnamespace = event.namespace ?
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
				null;

			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}

			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data == null ?
				[ event ] :
				jQuery.makeArray( data, [ event ] );

			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}

			// Determine event propagation path in advance, per W3C events spec (trac-9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (trac-9724)
			if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

				bubbleType = special.delegateType || type;
				if ( !rfocusMorph.test( bubbleType + type ) ) {
					cur = cur.parentNode;
				}
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push( cur );
					tmp = cur;
				}

				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( tmp === ( elem.ownerDocument || document ) ) {
					eventPath.push( tmp.defaultView || tmp.parentWindow || window );
				}
			}

			// Fire handlers on the event path
			i = 0;
			while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
				lastElement = cur;
				event.type = i > 1 ?
					bubbleType :
					special.bindType || type;

				// jQuery handler
				handle = ( dataPriv.get( cur, "events" ) || Object.create( null ) )[ event.type ] &&
					dataPriv.get( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}

				// Native handler
				handle = ontype && cur[ ontype ];
				if ( handle && handle.apply && acceptData( cur ) ) {
					event.result = handle.apply( cur, data );
					if ( event.result === false ) {
						event.preventDefault();
					}
				}
			}
			event.type = type;

			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {

				if ( ( !special._default ||
						special._default.apply( eventPath.pop(), data ) === false ) &&
					acceptData( elem ) ) {

					// Call a native DOM method on the target with the same name as the event.
					// Don't do default actions on window, that's where global variables be (trac-6170)
					if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

						// Don't re-trigger an onFOO event when we call its FOO() method
						tmp = elem[ ontype ];

						if ( tmp ) {
							elem[ ontype ] = null;
						}

						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;

						if ( event.isPropagationStopped() ) {
							lastElement.addEventListener( type, stopPropagationCallback );
						}

						elem[ type ]();

						if ( event.isPropagationStopped() ) {
							lastElement.removeEventListener( type, stopPropagationCallback );
						}

						jQuery.event.triggered = undefined;

						if ( tmp ) {
							elem[ ontype ] = tmp;
						}
					}
				}
			}

			return event.result;
		},

		// Piggyback on a donor event to simulate a different one
		// Used only for `focus(in | out)` events
		simulate: function( type, elem, event ) {
			var e = jQuery.extend(
				new jQuery.Event(),
				event,
				{
					type: type,
					isSimulated: true
				}
			);

			jQuery.event.trigger( e, null, elem );
		}

	} );

	jQuery.fn.extend( {

		trigger: function( type, data ) {
			return this.each( function() {
				jQuery.event.trigger( type, data, this );
			} );
		},
		triggerHandler: function( type, data ) {
			var elem = this[ 0 ];
			if ( elem ) {
				return jQuery.event.trigger( type, data, elem, true );
			}
		}
	} );


	var
		rbracket = /\[\]$/,
		rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;

	function buildParams( prefix, obj, traditional, add ) {
		var name;

		if ( Array.isArray( obj ) ) {

			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {

					// Treat each array item as a scalar.
					add( prefix, v );

				} else {

					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(
						prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
						v,
						traditional,
						add
					);
				}
			} );

		} else if ( !traditional && toType( obj ) === "object" ) {

			// Serialize object item.
			for ( name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}

		} else {

			// Serialize scalar item.
			add( prefix, obj );
		}
	}

// Serialize an array of form elements or a set of
// key/values into a query string
	jQuery.param = function( a, traditional ) {
		var prefix,
			s = [],
			add = function( key, valueOrFunction ) {

				// If value is a function, invoke it and use its return value
				var value = isFunction( valueOrFunction ) ?
					valueOrFunction() :
					valueOrFunction;

				s[ s.length ] = encodeURIComponent( key ) + "=" +
					encodeURIComponent( value == null ? "" : value );
			};

		if ( a == null ) {
			return "";
		}

		// If an array was passed in, assume that it is an array of form elements.
		if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			} );

		} else {

			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" );
	};

	jQuery.fn.extend( {
		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},
		serializeArray: function() {
			return this.map( function() {

				// Can add propHook for "elements" to filter or add form elements
				var elements = jQuery.prop( this, "elements" );
				return elements ? jQuery.makeArray( elements ) : this;
			} ).filter( function() {
				var type = this.type;

				// Use .is( ":disabled" ) so that fieldset[disabled] works
				return this.name && !jQuery( this ).is( ":disabled" ) &&
					rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
					( this.checked || !rcheckableType.test( type ) );
			} ).map( function( _i, elem ) {
				var val = jQuery( this ).val();

				if ( val == null ) {
					return null;
				}

				if ( Array.isArray( val ) ) {
					return jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					} );
				}

				return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} ).get();
		}
	} );


	var
		r20 = /%20/g,
		rhash = /#.*$/,
		rantiCache = /([?&])_=[^&]*/,
		rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

		// trac-7653, trac-8125, trac-8152: local protocol detection
		rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
		rnoContent = /^(?:GET|HEAD)$/,
		rprotocol = /^\/\//,

		/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
		prefilters = {},

		/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
		transports = {},

		// Avoid comment-prolog char sequence (trac-10098); must appease lint and evade compression
		allTypes = "*/".concat( "*" ),

		// Anchor tag for parsing the document origin
		originAnchor = document.createElement( "a" );

	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {

		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {

			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}

			var dataType,
				i = 0,
				dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

			if ( isFunction( func ) ) {

				// For each dataType in the dataTypeExpression
				while ( ( dataType = dataTypes[ i++ ] ) ) {

					// Prepend if requested
					if ( dataType[ 0 ] === "+" ) {
						dataType = dataType.slice( 1 ) || "*";
						( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

						// Otherwise append
					} else {
						( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
					}
				}
			}
		};
	}

// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

		var inspected = {},
			seekingTransport = ( structure === transports );

		function inspect( dataType ) {
			var selected;
			inspected[ dataType ] = true;
			jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
				var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
				if ( typeof dataTypeOrTransport === "string" &&
					!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

					options.dataTypes.unshift( dataTypeOrTransport );
					inspect( dataTypeOrTransport );
					return false;
				} else if ( seekingTransport ) {
					return !( selected = dataTypeOrTransport );
				}
			} );
			return selected;
		}

		return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
	}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes trac-9887
	function ajaxExtend( target, src ) {
		var key, deep,
			flatOptions = jQuery.ajaxSettings.flatOptions || {};

		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}

		return target;
	}

	/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
	function ajaxHandleResponses( s, jqXHR, responses ) {

		var ct, type, finalDataType, firstDataType,
			contents = s.contents,
			dataTypes = s.dataTypes;

		// Remove auto dataType and get content-type in the process
		while ( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
			}
		}

		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}

		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {

			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}

			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}

		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}

	/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
	function ajaxConvert( s, response, jqXHR, isSuccess ) {
		var conv2, current, conv, tmp, prev,
			converters = {},

			// Work with a copy of dataTypes in case we need to modify it for conversion
			dataTypes = s.dataTypes.slice();

		// Create converters map with lowercased keys
		if ( dataTypes[ 1 ] ) {
			for ( conv in s.converters ) {
				converters[ conv.toLowerCase() ] = s.converters[ conv ];
			}
		}

		current = dataTypes.shift();

		// Convert to each sequential dataType
		while ( current ) {

			if ( s.responseFields[ current ] ) {
				jqXHR[ s.responseFields[ current ] ] = response;
			}

			// Apply the dataFilter if provided
			if ( !prev && isSuccess && s.dataFilter ) {
				response = s.dataFilter( response, s.dataType );
			}

			prev = current;
			current = dataTypes.shift();

			if ( current ) {

				// There's only work to do if current dataType is non-auto
				if ( current === "*" ) {

					current = prev;

					// Convert response if prev dataType is non-auto and differs from current
				} else if ( prev !== "*" && prev !== current ) {

					// Seek a direct converter
					conv = converters[ prev + " " + current ] || converters[ "* " + current ];

					// If none found, seek a pair
					if ( !conv ) {
						for ( conv2 in converters ) {

							// If conv2 outputs current
							tmp = conv2.split( " " );
							if ( tmp[ 1 ] === current ) {

								// If prev can be converted to accepted input
								conv = converters[ prev + " " + tmp[ 0 ] ] ||
									converters[ "* " + tmp[ 0 ] ];
								if ( conv ) {

									// Condense equivalence converters
									if ( conv === true ) {
										conv = converters[ conv2 ];

										// Otherwise, insert the intermediate dataType
									} else if ( converters[ conv2 ] !== true ) {
										current = tmp[ 0 ];
										dataTypes.unshift( tmp[ 1 ] );
									}
									break;
								}
							}
						}
					}

					// Apply converter (if not an equivalence)
					if ( conv !== true ) {

						// Unless errors are allowed to bubble, catch and return them
						if ( conv && s.throws ) {
							response = conv( response );
						} else {
							try {
								response = conv( response );
							} catch ( e ) {
								return {
									state: "parsererror",
									error: conv ? e : "No conversion from " + prev + " to " + current
								};
							}
						}
					}
				}
			}
		}

		return { state: "success", data: response };
	}

	jQuery.extend( {

		// Counter for holding the number of active queries
		active: 0,

		// Last-Modified header cache for next request
		lastModified: {},
		etag: {},

		ajaxSettings: {
			url: location.href,
			type: "GET",
			isLocal: rlocalProtocol.test( location.protocol ),
			global: true,
			processData: true,
			async: true,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",

			/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

			accepts: {
				"*": allTypes,
				text: "text/plain",
				html: "text/html",
				xml: "application/xml, text/xml",
				json: "application/json, text/javascript"
			},

			contents: {
				xml: /\bxml\b/,
				html: /\bhtml/,
				json: /\bjson\b/
			},

			responseFields: {
				xml: "responseXML",
				text: "responseText",
				json: "responseJSON"
			},

			// Data converters
			// Keys separate source (or catchall "*") and destination types with a single space
			converters: {

				// Convert anything to text
				"* text": String,

				// Text to html (true = no transformation)
				"text html": true,

				// Evaluate text as a json expression
				"text json": JSON.parse,

				// Parse text as xml
				"text xml": jQuery.parseXML
			},

			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				url: true,
				context: true
			}
		},

		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			return settings ?

				// Building a settings object
				ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

				// Extending ajaxSettings
				ajaxExtend( jQuery.ajaxSettings, target );
		},

		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),

		// Main method
		ajax: function( url, options ) {

			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}

			// Force options to be an object
			options = options || {};

			var transport,

				// URL without anti-cache param
				cacheURL,

				// Response headers
				responseHeadersString,
				responseHeaders,

				// timeout handle
				timeoutTimer,

				// Url cleanup var
				urlAnchor,

				// Request state (becomes false upon send and true upon completion)
				completed,

				// To know if global events are to be dispatched
				fireGlobals,

				// Loop variable
				i,

				// uncached part of the url
				uncached,

				// Create the final options object
				s = jQuery.ajaxSetup( {}, options ),

				// Callbacks context
				callbackContext = s.context || s,

				// Context for global events is callbackContext if it is a DOM node or jQuery collection
				globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

				// Deferreds
				deferred = jQuery.Deferred(),
				completeDeferred = jQuery.Callbacks( "once memory" ),

				// Status-dependent callbacks
				statusCode = s.statusCode || {},

				// Headers (they are sent all at once)
				requestHeaders = {},
				requestHeadersNames = {},

				// Default abort message
				strAbort = "canceled",

				// Fake xhr
				jqXHR = {
					readyState: 0,

					// Builds headers hashtable if needed
					getResponseHeader: function( key ) {
						var match;
						if ( completed ) {
							if ( !responseHeaders ) {
								responseHeaders = {};
								while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
									responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
										( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
											.concat( match[ 2 ] );
								}
							}
							match = responseHeaders[ key.toLowerCase() + " " ];
						}
						return match == null ? null : match.join( ", " );
					},

					// Raw string
					getAllResponseHeaders: function() {
						return completed ? responseHeadersString : null;
					},

					// Caches the header
					setRequestHeader: function( name, value ) {
						if ( completed == null ) {
							name = requestHeadersNames[ name.toLowerCase() ] =
								requestHeadersNames[ name.toLowerCase() ] || name;
							requestHeaders[ name ] = value;
						}
						return this;
					},

					// Overrides response content-type header
					overrideMimeType: function( type ) {
						if ( completed == null ) {
							s.mimeType = type;
						}
						return this;
					},

					// Status-dependent callbacks
					statusCode: function( map ) {
						var code;
						if ( map ) {
							if ( completed ) {

								// Execute the appropriate callbacks
								jqXHR.always( map[ jqXHR.status ] );
							} else {

								// Lazy-add the new callbacks in a way that preserves old ones
								for ( code in map ) {
									statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
								}
							}
						}
						return this;
					},

					// Cancel the request
					abort: function( statusText ) {
						var finalText = statusText || strAbort;
						if ( transport ) {
							transport.abort( finalText );
						}
						done( 0, finalText );
						return this;
					}
				};

			// Attach deferreds
			deferred.promise( jqXHR );

			// Add protocol if not provided (prefilters might expect it)
			// Handle falsy url in the settings object (trac-10093: consistency with old signature)
			// We also use the url parameter if available
			s.url = ( ( url || s.url || location.href ) + "" )
				.replace( rprotocol, location.protocol + "//" );

			// Alias method option to type as per ticket trac-12004
			s.type = options.method || options.type || s.method || s.type;

			// Extract dataTypes list
			s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

			// A cross-domain request is in order when the origin doesn't match the current origin.
			if ( s.crossDomain == null ) {
				urlAnchor = document.createElement( "a" );

				// Support: IE <=8 - 11, Edge 12 - 15
				// IE throws exception on accessing the href property if url is malformed,
				// e.g. http://example.com:80x/
				try {
					urlAnchor.href = s.url;

					// Support: IE <=8 - 11 only
					// Anchor's host property isn't correctly set when s.url is relative
					urlAnchor.href = urlAnchor.href;
					s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
						urlAnchor.protocol + "//" + urlAnchor.host;
				} catch ( e ) {

					// If there is an error parsing the URL, assume it is crossDomain,
					// it can be rejected by the transport if it is invalid
					s.crossDomain = true;
				}
			}

			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}

			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

			// If request was aborted inside a prefilter, stop there
			if ( completed ) {
				return jqXHR;
			}

			// We can fire global events as of now if asked to
			// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (trac-15118)
			fireGlobals = jQuery.event && s.global;

			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}

			// Uppercase the type
			s.type = s.type.toUpperCase();

			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );

			// Save the URL in case we're toying with the If-Modified-Since
			// and/or If-None-Match header later on
			// Remove hash to simplify url manipulation
			cacheURL = s.url.replace( rhash, "" );

			// More options handling for requests with no content
			if ( !s.hasContent ) {

				// Remember the hash so we can put it back
				uncached = s.url.slice( cacheURL.length );

				// If data is available and should be processed, append data to url
				if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
					cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

					// trac-9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}

				// Add or update anti-cache param if needed
				if ( s.cache === false ) {
					cacheURL = cacheURL.replace( rantiCache, "$1" );
					uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce.guid++ ) +
						uncached;
				}

				// Put hash and anti-cache on the URL that will be requested (gh-1732)
				s.url = cacheURL + uncached;

				// Change '%20' to '+' if this is encoded form body content (gh-2658)
			} else if ( s.data && s.processData &&
				( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
				s.data = s.data.replace( r20, "+" );
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
				}
				if ( jQuery.etag[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
				}
			}

			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}

			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
				"Accept",
				s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
					s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
					s.accepts[ "*" ]
			);

			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}

			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend &&
				( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

				// Abort if not done already and return
				return jqXHR.abort();
			}

			// Aborting is no longer a cancellation
			strAbort = "abort";

			// Install callbacks on deferreds
			completeDeferred.add( s.complete );
			jqXHR.done( s.success );
			jqXHR.fail( s.error );

			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;

				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}

				// If request was aborted inside ajaxSend, stop there
				if ( completed ) {
					return jqXHR;
				}

				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = window.setTimeout( function() {
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}

				try {
					completed = false;
					transport.send( requestHeaders, done );
				} catch ( e ) {

					// Rethrow post-completion exceptions
					if ( completed ) {
						throw e;
					}

					// Propagate others as results
					done( -1, e );
				}
			}

			// Callback for when everything is done
			function done( status, nativeStatusText, responses, headers ) {
				var isSuccess, success, error, response, modified,
					statusText = nativeStatusText;

				// Ignore repeat invocations
				if ( completed ) {
					return;
				}

				completed = true;

				// Clear timeout if it exists
				if ( timeoutTimer ) {
					window.clearTimeout( timeoutTimer );
				}

				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;

				// Cache response headers
				responseHeadersString = headers || "";

				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;

				// Determine if successful
				isSuccess = status >= 200 && status < 300 || status === 304;

				// Get response data
				if ( responses ) {
					response = ajaxHandleResponses( s, jqXHR, responses );
				}

				// Use a noop converter for missing script but not if jsonp
				if ( !isSuccess &&
					jQuery.inArray( "script", s.dataTypes ) > -1 &&
					jQuery.inArray( "json", s.dataTypes ) < 0 ) {
					s.converters[ "text script" ] = function() {};
				}

				// Convert no matter what (that way responseXXX fields are always set)
				response = ajaxConvert( s, response, jqXHR, isSuccess );

				// If successful, handle type chaining
				if ( isSuccess ) {

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {
						modified = jqXHR.getResponseHeader( "Last-Modified" );
						if ( modified ) {
							jQuery.lastModified[ cacheURL ] = modified;
						}
						modified = jqXHR.getResponseHeader( "etag" );
						if ( modified ) {
							jQuery.etag[ cacheURL ] = modified;
						}
					}

					// if no content
					if ( status === 204 || s.type === "HEAD" ) {
						statusText = "nocontent";

						// if not modified
					} else if ( status === 304 ) {
						statusText = "notmodified";

						// If we have data, let's convert it
					} else {
						statusText = response.state;
						success = response.data;
						error = response.error;
						isSuccess = !error;
					}
				} else {

					// Extract error from statusText and normalize for non-aborts
					error = statusText;
					if ( status || !statusText ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}

				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = ( nativeStatusText || statusText ) + "";

				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}

				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;

				if ( fireGlobals ) {
					globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
						[ jqXHR, s, isSuccess ? success : error ] );
				}

				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}

			return jqXHR;
		},

		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},

		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		}
	} );

	jQuery.each( [ "get", "post" ], function( _i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {

			// Shift arguments if data argument was omitted
			if ( isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}

			// The url can be an options object (which then must have .url)
			return jQuery.ajax( jQuery.extend( {
				url: url,
				type: method,
				dataType: type,
				data: data,
				success: callback
			}, jQuery.isPlainObject( url ) && url ) );
		};
	} );

	jQuery.ajaxPrefilter( function( s ) {
		var i;
		for ( i in s.headers ) {
			if ( i.toLowerCase() === "content-type" ) {
				s.contentType = s.headers[ i ] || "";
			}
		}
	} );


	jQuery._evalUrl = function( url, options, doc ) {
		return jQuery.ajax( {
			url: url,

			// Make this explicit, since user can override this through ajaxSetup (trac-11264)
			type: "GET",
			dataType: "script",
			cache: true,
			async: false,
			global: false,

			// Only evaluate the response if it is successful (gh-4126)
			// dataFilter is not invoked for failure responses, so using it instead
			// of the default converter is kludgy but it works.
			converters: {
				"text script": function() {}
			},
			dataFilter: function( response ) {
				jQuery.globalEval( response, options, doc );
			}
		} );
	};


	jQuery.fn.extend( {
		wrapAll: function( html ) {
			var wrap;

			if ( this[ 0 ] ) {
				if ( isFunction( html ) ) {
					html = html.call( this[ 0 ] );
				}

				// The elements to wrap the target around
				wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

				if ( this[ 0 ].parentNode ) {
					wrap.insertBefore( this[ 0 ] );
				}

				wrap.map( function() {
					var elem = this;

					while ( elem.firstElementChild ) {
						elem = elem.firstElementChild;
					}

					return elem;
				} ).append( this );
			}

			return this;
		},

		wrapInner: function( html ) {
			if ( isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapInner( html.call( this, i ) );
				} );
			}

			return this.each( function() {
				var self = jQuery( this ),
					contents = self.contents();

				if ( contents.length ) {
					contents.wrapAll( html );

				} else {
					self.append( html );
				}
			} );
		},

		wrap: function( html ) {
			var htmlIsFunction = isFunction( html );

			return this.each( function( i ) {
				jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
			} );
		},

		unwrap: function( selector ) {
			this.parent( selector ).not( "body" ).each( function() {
				jQuery( this ).replaceWith( this.childNodes );
			} );
			return this;
		}
	} );


	jQuery.expr.pseudos.hidden = function( elem ) {
		return !jQuery.expr.pseudos.visible( elem );
	};
	jQuery.expr.pseudos.visible = function( elem ) {
		return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
	};




	jQuery.ajaxSettings.xhr = function() {
		try {
			return new window.XMLHttpRequest();
		} catch ( e ) {}
	};

	var xhrSuccessStatus = {

			// File protocol always yields status code 0, assume 200
			0: 200,

			// Support: IE <=9 only
			// trac-1450: sometimes IE returns 1223 when it should be 204
			1223: 204
		},
		xhrSupported = jQuery.ajaxSettings.xhr();

	support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
	support.ajax = xhrSupported = !!xhrSupported;

	jQuery.ajaxTransport( function( options ) {
		var callback, errorCallback;

		// Cross domain only allowed if supported through XMLHttpRequest
		if ( support.cors || xhrSupported && !options.crossDomain ) {
			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr();

					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						xhr.setRequestHeader( i, headers[ i ] );
					}

					// Callback
					callback = function( type ) {
						return function() {
							if ( callback ) {
								callback = errorCallback = xhr.onload =
									xhr.onerror = xhr.onabort = xhr.ontimeout =
										xhr.onreadystatechange = null;

								if ( type === "abort" ) {
									xhr.abort();
								} else if ( type === "error" ) {

									// Support: IE <=9 only
									// On a manual native abort, IE9 throws
									// errors on any property access that is not readyState
									if ( typeof xhr.status !== "number" ) {
										complete( 0, "error" );
									} else {
										complete(

											// File: protocol always yields status 0; see trac-8605, trac-14207
											xhr.status,
											xhr.statusText
										);
									}
								} else {
									complete(
										xhrSuccessStatus[ xhr.status ] || xhr.status,
										xhr.statusText,

										// Support: IE <=9 only
										// IE9 has no XHR2 but throws on binary (trac-11426)
										// For XHR2 non-text, let the caller handle it (gh-2498)
										( xhr.responseType || "text" ) !== "text"  ||
										typeof xhr.responseText !== "string" ?
											{ binary: xhr.response } :
											{ text: xhr.responseText },
										xhr.getAllResponseHeaders()
									);
								}
							}
						};
					};

					// Listen to events
					xhr.onload = callback();
					errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

					// Support: IE 9 only
					// Use onreadystatechange to replace onabort
					// to handle uncaught aborts
					if ( xhr.onabort !== undefined ) {
						xhr.onabort = errorCallback;
					} else {
						xhr.onreadystatechange = function() {

							// Check readyState before timeout as it changes
							if ( xhr.readyState === 4 ) {

								// Allow onerror to be called first,
								// but that will not handle a native abort
								// Also, save errorCallback to a variable
								// as xhr.onerror cannot be accessed
								window.setTimeout( function() {
									if ( callback ) {
										errorCallback();
									}
								} );
							}
						};
					}

					// Create the abort callback
					callback = callback( "abort" );

					try {

						// Do send the request (this may raise an exception)
						xhr.send( options.hasContent && options.data || null );
					} catch ( e ) {

						// trac-14683: Only rethrow if this hasn't been notified as an error yet
						if ( callback ) {
							throw e;
						}
					}
				},

				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
	jQuery.ajaxPrefilter( function( s ) {
		if ( s.crossDomain ) {
			s.contents.script = false;
		}
	} );

// Install script dataType
	jQuery.ajaxSetup( {
		accepts: {
			script: "text/javascript, application/javascript, " +
				"application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /\b(?:java|ecma)script\b/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	} );

// Handle cache's special case and crossDomain
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
		}
	} );

// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function( s ) {

		// This transport only deals with cross domain or forced-by-attrs requests
		if ( s.crossDomain || s.scriptAttrs ) {
			var script, callback;
			return {
				send: function( _, complete ) {
					script = jQuery( "<script>" )
						.attr( s.scriptAttrs || {} )
						.prop( { charset: s.scriptCharset, src: s.url } )
						.on( "load error", callback = function( evt ) {
							script.remove();
							callback = null;
							if ( evt ) {
								complete( evt.type === "error" ? 404 : 200, evt.type );
							}
						} );

					// Use native DOM manipulation to avoid our domManip AJAX trickery
					document.head.appendChild( script[ 0 ] );
				},
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	var oldCallbacks = [],
		rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
	jQuery.ajaxSetup( {
		jsonp: "callback",
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
			this[ callback ] = true;
			return callback;
		}
	} );

// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

		var callbackName, overwritten, responseContainer,
			jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
					"url" :
					typeof s.data === "string" &&
					( s.contentType || "" )
						.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
					rjsonp.test( s.data ) && "data"
			);

		// Handle iff the expected data type is "jsonp" or we have a parameter to set
		if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

			// Get callback name, remembering preexisting value associated with it
			callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
				s.jsonpCallback() :
				s.jsonpCallback;

			// Insert callback into url or form data
			if ( jsonProp ) {
				s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
			} else if ( s.jsonp !== false ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
			}

			// Use data converter to retrieve json after script execution
			s.converters[ "script json" ] = function() {
				if ( !responseContainer ) {
					jQuery.error( callbackName + " was not called" );
				}
				return responseContainer[ 0 ];
			};

			// Force json dataType
			s.dataTypes[ 0 ] = "json";

			// Install callback
			overwritten = window[ callbackName ];
			window[ callbackName ] = function() {
				responseContainer = arguments;
			};

			// Clean-up function (fires after converters)
			jqXHR.always( function() {

				// If previous value didn't exist - remove it
				if ( overwritten === undefined ) {
					jQuery( window ).removeProp( callbackName );

					// Otherwise restore preexisting value
				} else {
					window[ callbackName ] = overwritten;
				}

				// Save back as free
				if ( s[ callbackName ] ) {

					// Make sure that re-using the options doesn't screw things around
					s.jsonpCallback = originalSettings.jsonpCallback;

					// Save the callback name for future use
					oldCallbacks.push( callbackName );
				}

				// Call if it was a function and we have a response
				if ( responseContainer && isFunction( overwritten ) ) {
					overwritten( responseContainer[ 0 ] );
				}

				responseContainer = overwritten = undefined;
			} );

			// Delegate to script
			return "script";
		}
	} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
	support.createHTMLDocument = ( function() {
		var body = document.implementation.createHTMLDocument( "" ).body;
		body.innerHTML = "<form></form><form></form>";
		return body.childNodes.length === 2;
	} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
	jQuery.parseHTML = function( data, context, keepScripts ) {
		if ( typeof data !== "string" ) {
			return [];
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		var base, parsed, scripts;

		if ( !context ) {

			// Stop scripts or inline event handlers from being executed immediately
			// by using document.implementation
			if ( support.createHTMLDocument ) {
				context = document.implementation.createHTMLDocument( "" );

				// Set the base href for the created document
				// so any parsed elements with URLs
				// are based on the document's URL (gh-2965)
				base = context.createElement( "base" );
				base.href = document.location.href;
				context.head.appendChild( base );
			} else {
				context = document;
			}
		}

		parsed = rsingleTag.exec( data );
		scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}

		parsed = buildFragment( [ data ], context, scripts );

		if ( scripts && scripts.length ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	};


	/**
	 * Load a url into a page
	 */
	jQuery.fn.load = function( url, params, callback ) {
		var selector, type, response,
			self = this,
			off = url.indexOf( " " );

		if ( off > -1 ) {
			selector = stripAndCollapse( url.slice( off ) );
			url = url.slice( 0, off );
		}

		// If it's a function
		if ( isFunction( params ) ) {

			// We assume that it's the callback
			callback = params;
			params = undefined;

			// Otherwise, build a param string
		} else if ( params && typeof params === "object" ) {
			type = "POST";
		}

		// If we have elements to modify, make the request
		if ( self.length > 0 ) {
			jQuery.ajax( {
				url: url,

				// If "type" variable is undefined, then "GET" method will be used.
				// Make value of this field explicit since
				// user can override it through ajaxSetup method
				type: type || "GET",
				dataType: "html",
				data: params
			} ).done( function( responseText ) {

				// Save response for use in complete callback
				response = arguments;

				self.html( selector ?

					// If a selector was specified, locate the right elements in a dummy div
					// Exclude scripts to avoid IE 'Permission Denied' errors
					jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

					// Otherwise use the full result
					responseText );

				// If the request succeeds, this function gets "data", "status", "jqXHR"
				// but they are ignored because response was set above.
				// If it fails, this function gets "jqXHR", "status", "error"
			} ).always( callback && function( jqXHR, status ) {
				self.each( function() {
					callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
				} );
			} );
		}

		return this;
	};




	jQuery.expr.pseudos.animated = function( elem ) {
		return jQuery.grep( jQuery.timers, function( fn ) {
			return elem === fn.elem;
		} ).length;
	};




	jQuery.offset = {
		setOffset: function( elem, options, i ) {
			var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
				position = jQuery.css( elem, "position" ),
				curElem = jQuery( elem ),
				props = {};

			// Set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}

			curOffset = curElem.offset();
			curCSSTop = jQuery.css( elem, "top" );
			curCSSLeft = jQuery.css( elem, "left" );
			calculatePosition = ( position === "absolute" || position === "fixed" ) &&
				( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

			// Need to be able to calculate position if either
			// top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;

			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}

			if ( isFunction( options ) ) {

				// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
				options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
			}

			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}

			if ( "using" in options ) {
				options.using.call( elem, props );

			} else {
				curElem.css( props );
			}
		}
	};

	jQuery.fn.extend( {

		// offset() relates an element's border box to the document origin
		offset: function( options ) {

			// Preserve chaining for setter
			if ( arguments.length ) {
				return options === undefined ?
					this :
					this.each( function( i ) {
						jQuery.offset.setOffset( this, options, i );
					} );
			}

			var rect, win,
				elem = this[ 0 ];

			if ( !elem ) {
				return;
			}

			// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
			// Support: IE <=11 only
			// Running getBoundingClientRect on a
			// disconnected node in IE throws an error
			if ( !elem.getClientRects().length ) {
				return { top: 0, left: 0 };
			}

			// Get document-relative position by adding viewport scroll to viewport-relative gBCR
			rect = elem.getBoundingClientRect();
			win = elem.ownerDocument.defaultView;
			return {
				top: rect.top + win.pageYOffset,
				left: rect.left + win.pageXOffset
			};
		},

		// position() relates an element's margin box to its offset parent's padding box
		// This corresponds to the behavior of CSS absolute positioning
		position: function() {
			if ( !this[ 0 ] ) {
				return;
			}

			var offsetParent, offset, doc,
				elem = this[ 0 ],
				parentOffset = { top: 0, left: 0 };

			// position:fixed elements are offset from the viewport, which itself always has zero offset
			if ( jQuery.css( elem, "position" ) === "fixed" ) {

				// Assume position:fixed implies availability of getBoundingClientRect
				offset = elem.getBoundingClientRect();

			} else {
				offset = this.offset();

				// Account for the *real* offset parent, which can be the document or its root element
				// when a statically positioned element is identified
				doc = elem.ownerDocument;
				offsetParent = elem.offsetParent || doc.documentElement;
				while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

					offsetParent = offsetParent.parentNode;
				}
				if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

					// Incorporate borders into its offset, since they are outside its content origin
					parentOffset = jQuery( offsetParent ).offset();
					parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
					parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
				}
			}

			// Subtract parent offsets and element margins
			return {
				top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
				left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
			};
		},

		// This method will return documentElement in the following cases:
		// 1) For the element inside the iframe without offsetParent, this method will return
		//    documentElement of the parent window
		// 2) For the hidden or detached element
		// 3) For body or html element, i.e. in case of the html node - it will return itself
		//
		// but those exceptions were never presented as a real life use-cases
		// and might be considered as more preferable results.
		//
		// This logic, however, is not guaranteed and can change at any point in the future
		offsetParent: function() {
			return this.map( function() {
				var offsetParent = this.offsetParent;

				while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || documentElement;
			} );
		}
	} );

// Create scrollLeft and scrollTop methods
	jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
		var top = "pageYOffset" === prop;

		jQuery.fn[ method ] = function( val ) {
			return access( this, function( elem, method, val ) {

				// Coalesce documents and windows
				var win;
				if ( isWindow( elem ) ) {
					win = elem;
				} else if ( elem.nodeType === 9 ) {
					win = elem.defaultView;
				}

				if ( val === undefined ) {
					return win ? win[ prop ] : elem[ method ];
				}

				if ( win ) {
					win.scrollTo(
						!top ? val : win.pageXOffset,
						top ? val : win.pageYOffset
					);

				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length );
		};
	} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
	jQuery.each( [ "top", "left" ], function( _i, prop ) {
		jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
			function( elem, computed ) {
				if ( computed ) {
					computed = curCSS( elem, prop );

					// If curCSS returns percentage, fallback to offset
					return rnumnonpx.test( computed ) ?
						jQuery( elem ).position()[ prop ] + "px" :
						computed;
				}
			}
		);
	} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		jQuery.each( {
			padding: "inner" + name,
			content: type,
			"": "outer" + name
		}, function( defaultExtra, funcName ) {

			// Margin is only for outerHeight, outerWidth
			jQuery.fn[ funcName ] = function( margin, value ) {
				var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
					extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

				return access( this, function( elem, type, value ) {
					var doc;

					if ( isWindow( elem ) ) {

						// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
						return funcName.indexOf( "outer" ) === 0 ?
							elem[ "inner" + name ] :
							elem.document.documentElement[ "client" + name ];
					}

					// Get document width or height
					if ( elem.nodeType === 9 ) {
						doc = elem.documentElement;

						// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
						// whichever is greatest
						return Math.max(
							elem.body[ "scroll" + name ], doc[ "scroll" + name ],
							elem.body[ "offset" + name ], doc[ "offset" + name ],
							doc[ "client" + name ]
						);
					}

					return value === undefined ?

						// Get width or height on the element, requesting but not forcing parseFloat
						jQuery.css( elem, type, extra ) :

						// Set width or height on the element
						jQuery.style( elem, type, value, extra );
				}, type, chainable ? margin : undefined, chainable );
			};
		} );
	} );


	jQuery.each( [
		"ajaxStart",
		"ajaxStop",
		"ajaxComplete",
		"ajaxError",
		"ajaxSuccess",
		"ajaxSend"
	], function( _i, type ) {
		jQuery.fn[ type ] = function( fn ) {
			return this.on( type, fn );
		};
	} );




	jQuery.fn.extend( {

		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},

		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {

			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length === 1 ?
				this.off( selector, "**" ) :
				this.off( types, selector || "**", fn );
		},

		hover: function( fnOver, fnOut ) {
			return this
				.on( "mouseenter", fnOver )
				.on( "mouseleave", fnOut || fnOver );
		}
	} );

	jQuery.each(
		( "blur focus focusin focusout resize scroll click dblclick " +
			"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
			"change select submit keydown keypress keyup contextmenu" ).split( " " ),
		function( _i, name ) {

			// Handle event binding
			jQuery.fn[ name ] = function( data, fn ) {
				return arguments.length > 0 ?
					this.on( name, null, data, fn ) :
					this.trigger( name );
			};
		}
	);




// Support: Android <=4.0 only
// Make sure we trim BOM and NBSP
// Require that the "whitespace run" starts from a non-whitespace
// to avoid O(N^2) behavior when the engine would try matching "\s+$" at each space position.
	var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
	jQuery.proxy = function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	};

	jQuery.holdReady = function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	};
	jQuery.isArray = Array.isArray;
	jQuery.parseJSON = JSON.parse;
	jQuery.nodeName = nodeName;
	jQuery.isFunction = isFunction;
	jQuery.isWindow = isWindow;
	jQuery.camelCase = camelCase;
	jQuery.type = toType;

	jQuery.now = Date.now;

	jQuery.isNumeric = function( obj ) {

		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
		var type = jQuery.type( obj );
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	};

	jQuery.trim = function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "$1" );
	};



// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function() {
			return jQuery;
		} );
	}




	var

		// Map over jQuery in case of overwrite
		_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
		_$ = window.$;

	jQuery.noConflict = function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	};

// Expose jQuery and $ identifiers, even in AMD
// (trac-7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (trac-13566)
	if ( typeof noGlobal === "undefined" ) {
		window.jQuery = window.$ = jQuery;
	}




	return jQuery;
} );
},{}],46:[function(require,module,exports){
var tempElem;
var $ = require("./jquery.js");
var $b = $.build;

var that = {};

that.init = function (container){
  tempElem = container.clone().empty().removeAttr("id").css({visibility:"hidden", position:"absolute", top:-500, left:-1000, width:$(window).width()});
  $("body").append(tempElem);
  return that;
};

that.measure = function (elemToMeasure, selector){
  if(!tempElem){
    throw new Error("Must call init before measure");
  }
  //measures the real size of a previously unrendered element, by putting it in a 
  //fake form in a hidden part of the dom then taking its outerWidth then removing it.
  var clone = elemToMeasure.clone();
  //clone.show();
  tempElem.append(clone);

  var tgt = clone;
  var w = clone.outerWidth();
  var h = clone.outerHeight();
  clone.remove();
  return {w:w, h:h};
};

module.exports = that;
},{"./jquery.js":45}],47:[function(require,module,exports){
var $ = require("./jquery.js");
var $b = $.build;
var measure = require("./measure.js");

var create = function (elem, opts){
  var that = {};
  opts = $.extend({closeBtn:true}, opts);

  var modalElem, maskElem, contentElem, mainElem, closeElem, winResizeEvt;

  var makeElems = function (){
    modalElem = $b(".mktoModal",[
      maskElem = $b(".mktoModalMask"),
      contentElem = $b(".mktoModalContent", [
        closeElem = $b(".mktoModalClose", [" X "]).click(that.modalCloseClicked),
        mainElem = $b(".mktoModalMain")
      ])
    ]);
    return modalElem;
  };
  that.modalCloseClicked = function (){
    that.hide();
  };
  var positionContent = function (){
    var h = contentElem.height();
    var w = contentElem.width();
    if(!h || !w){
      setTimeout(positionContent, 25);
      return;
    }

    var winW = $(window).width();
    var winH = $(window).height();
    var scrollTop = $(window).scrollTop();
    var docHeight = $(document).height();

    var offsetW = Math.max(0, (winW/2) - (w/2));
    var offsetH = Math.max(10, (winH/2) - (h/2));
    contentElem.css({
      top:(offsetH + scrollTop )+ "px",
      left:offsetW + "px"
    });
    maskElem.css("height", docHeight);
  };
  
  that.show = function (){
    var modalElem = makeElems();
    var elemSize = measure.measure(elem);
    mainElem.css("width", elemSize.w);
    mainElem.append(elem);
    if(!opts.closeBtn){
      closeElem.remove();
    }
    maskElem.hide();
    contentElem.hide();
    positionContent();
    $("body").append(modalElem);
    maskElem.fadeIn();
    contentElem.fadeIn();
    $(window).on("resize.mktoModal", positionContent);
    return that;
  };

  that.hide = function (){
    maskElem.fadeOut();
    contentElem.fadeOut(function (){
      setTimeout(function (){
        elem.detach();
        modalElem.remove();
        $(window).off("resize.mktoModal");
      },10);
    });
    return that;
  };
  return that;
}
module.exports = create;
},{"./jquery.js":45,"./measure.js":46}],48:[function(require,module,exports){
/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-input-inputtypes-localstorage-postmessage-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-css_boxsizing-forms_validation-load
 * 
 * Modified by itaylor to simplify form validation checking and to make it browerserifyable. 
 */
;



var Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},


    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  = document.createElement('input')  ,

    smile = ':)',

    toString = {}.toString,

    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),


    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },



    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

            var isSupported = eventName in element;

        if ( !isSupported ) {
                if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

                    if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),


    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

            } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }    tests['postmessage'] = function() {
      return !!window.postMessage;
    };



    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    function webforms() {
                                            Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
                                  attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
                            Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                                                    if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;
                      if (defaultView.getComputedStyle){
                        var cs = defaultView.getComputedStyle(inputElem, null);
                         
                        bool = cs && cs.WebkitAppearance !== 'textfield' && (inputElem.offsetHeight !== 0);  
                      }

                      

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                                                                                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                                        bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        }
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    Modernizr.input || webforms();


     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; 
     };


    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;


    Modernizr.hasEvent      = isEventSupported;

    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    Modernizr.testStyles    = injectElementWithStyles;
    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
            return testPropsAll(prop, obj, elem);
      }
    };

    return Modernizr;

})(window, window.document);
var yepnope = require("./yepnope.js");
Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};

// developer.mozilla.org/en/CSS/box-sizing
// github.com/Modernizr/Modernizr/issues/248

Modernizr.addTest("boxsizing",function(){
  return Modernizr.testAllProps("boxSizing") && (document.documentMode === undefined || document.documentMode > 7);
});

Modernizr.addTest("borderradius", function (){
  return Modernizr.testAllProps('borderRadius');    
});

Modernizr.addTest('formvalidation', function(){
  var form = document.createElement('form');
  return ('checkValidity' in form);
});

Modernizr.addTest('cors', function (){
  return !!(window.XMLHttpRequest && 'withCredentials' in new window.XMLHttpRequest());
});

Modernizr.addTest('textareamaxlength', function (){
  var ta = document.createElement('textarea');
  return ('maxLength' in ta);
});

Modernizr.addTest('csstransforms', function() {
  return !!Modernizr.testAllProps('transform');
});

Modernizr.addTest('csschecked', function(){
  return Modernizr.testStyles('#modernizr input {width:100px} #modernizr input:checked {width:200px;display:block}', function(elem, rule){
     var cb = document.createElement('input');
     cb.setAttribute("type", "checkbox");
     cb.setAttribute("checked", "checked");
     elem.appendChild(cb);
     return cb.offsetWidth >= 200;
   });
 });

Modernizr.addTest('json', function (){
  return !! ((window.JSON && JSON.stringify && JSON.parse) && !(document.documentMode && document.documentMode < 9))
});

module.exports = Modernizr;

},{"./yepnope.js":55}],49:[function(require,module,exports){
var fh = require("./fields/fieldHelpers.js");
var $ = require("./jquery.js");

var inArr = function (arr, val){
  return $.inArray(val, arr) != -1;
}
var truthish = ["true", "1", "yes", "Yes"];
var falseish = ["false", "0", "no", "No"];
var booleanish = truthish.concat(falseish);


//Looks for the real string value of a pick list value.
//So if the field has values "Yes"/"No" and you pass 1 as the candidate, it'd return "Yes".
//If it can't find a match, the stringified input is returned.
function findPicklistRealValue(field, candidate){
  var orig = candidate;
  candidate = ("" + candidate);
  var arrToUse = inArr(truthish, candidate) ? truthish : falseish; 

  for(var i = 0; i < field.PicklistValues.length ; i++){
    var realVal = field.PicklistValues[i].value || "";
    if(inArr(arrToUse, realVal)){
      return realVal;
    }
  }
  return "" + orig; //Not found, return string  
}

function hasTruthyAndFalsey(field){
  var hasTruthy = false;
  var hasFalsey = false;

  for(var i=0; i < field.PicklistValues.length ; i++ ){
    var val = (field.PicklistValues[i].value || "");
    if(inArr(truthish, val)){
      hasTruthy = true;
    }
    if(inArr(falseish, val)){
      hasFalsey = true;
    }
  }
  return hasTruthy && hasFalsey;
}

function hasBlankValue(field){
  for(var i=0; i < field.PicklistValues.length ; i++ ){
    var val = field.PicklistValues[i].value;
    if(val === ""){
      return true;
    }
  }
  return false;
}


//For a picklist to be boolean, it must have a truthy and a falsey value and must have 2 or 3 choices (blanks are allowed)
//but it cannot be a multi-select picklist.
function isPicklistBoolean(field){
  if(!field.PicklistValues || field.IsMultiselect){
    return false;
  }
  if(field.PicklistValues.length == 2){
    return hasTruthyAndFalsey(field);
  }
  if(field.PicklistValues.length == 3){
    return hasTruthyAndFalsey(field) && hasBlankValue(field);
  }
  return false;
}

//A checkbox is a boolean if it has exactly one field, and that field is truthy
function isCheckboxBoolean(field){
  if(!field.PicklistValues){
    return false;
  }
  return field.PicklistValues.length == 1 && inArr(truthish, (field.PicklistValues[0].value || ""));
}

//For a radio to be boolean, it must have a truthy and a falsey value and must have 2 choices
function isRadioBoolean(field){
  if(!field.PicklistValues){
    return false;
  }
  if(field.PicklistValues.length == 2){
    return hasTruthyAndFalsey(field);
  }
  return false;
}

function coercePicklist(field, value){
  if(value === null || value === undefined){
    return "";
  }
  //A picklist is either a boolean yes/no, or a nullable boolean ""/yes/no, 
  //a single string, or a comma separated string representing multiple values being selected.
  var isBool = isPicklistBoolean(field); 
  if(value === "" && isBool && !hasBlankValue(field)){
    value = false;
  }
  if(value !== "" && isBool){
    value = findPicklistRealValue(field, value);
  }
  return "" + value;
}

function coerceRadio(field, value){
  if(value === null || value === undefined){
    return "";
  }
  //A radio without a blank field that is set to empty string "" should 
  //check the falsey of the two values.
  var isBool = isRadioBoolean(field); 
  if(value === "" && isBool){
    value = false;
  }
  if(isBool){
    value = findPicklistRealValue(field, value);
  }
  return "" + value;
}

//Form prefill sets full iso date times like this...
//2001-01-01 15:00
//but we only accept the date part.
function coerceDate(field, value){
  if(value === null || value === undefined){
    return "";
  }
  value = "" + value;
  return value.split(/\s|T/)[0];
}

function coerceCheckbox(field, value){
  if(value === null || value === undefined){
    return "";
  }
  if(isCheckboxBoolean(field)){
    value = findPicklistRealValue(field, value);
  }
  return "" + value;
}

function coerceTypes(prefillData, formData){
  var result = {};
  var fieldsByName = fh.getFieldsByName(fh.getFlattenedFields(formData));
  $.each(prefillData, function (key, value){
    var field = fieldsByName[key];
    //Don't set values for fields that don't exist in the form
    if(!field || value === null){
      //mktoPrefilFields uses null to mean "Never Set", not "has a value and that value is null" 
      //so any field with value === null should be removed from the list of fields to set and 
      //remain with its current value;
      return;
    }
    var dt = field.Datatype;
    if(dt === "picklist"){
      result[key] = coercePicklist(field, value);
    }else if(dt === "radio"){
      result[key] = coerceRadio(field, value);
    }else if (dt === "checkbox" || dt === "single_checkbox"){
      result[key] = coerceCheckbox(field, value);
    }else if (dt === "date"){
      result[key] = coerceDate(field, value);
    }else{
      value = "" + value;
      result[key] = value;
    }
  });
  return result;
}

module.exports.coerceTypes = coerceTypes;

},{"./fields/fieldHelpers.js":29,"./jquery.js":45}],50:[function(require,module,exports){
module.exports = safeLog;

function safeLog(){
  try{
    if(typeof console !== 'undefined' && typeof console.log === 'function'){
      try{
        console.log.apply(console, arguments);
      }catch(ex){
        console.log(Array.prototype.slice.call(arguments, 0));
      }
    }
  }catch(ex){
    //logging is not worth throwing an exception over
  }
}
},{}],51:[function(require,module,exports){
//In a perfect world, Old IE wouldn't exist, or we wouldn't care about it.
//In a more perfect world, Browserify would be able to handle/guarantee old IE compatibility
//In an ok world, we'd be able to include a whole ES5-shim without bloating the download size or messing up customer's existing JS
//In the real world, we're stuck with only monkey patching the things that are blatantly broken.

//This file contains selected ES5 monkey patches that are as minimal in size and scope as possible. 
module.exports = {};
var $ = require("./jquery.js");

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = _Array_slice_.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var binder = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    args.concat(_Array_slice_.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(_Array_slice_.call(arguments))
                );

            }

        };

        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.

        var boundLength = Math.max(0, target.length - args.length);

        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            boundArgs.push("$" + i);
        }

        // XXX Build a dynamic function with desired amount of arguments is the only 
        // way to set the length property of a function. 
        // In environments where Content Security Policies enabled (Chrome extensions, 
        // for ex.) all use of eval or Function costructor throws an exception. 
        // However in all of these environments Function.prototype.bind exists 
        // and so this code will never be executed.
        /*jshint -W061 */
        var bound = Function("binder", "return function(" + boundArgs.join(",") + "){return binder.apply(this,arguments)}")(binder);

        if (target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var _Array_slice_ = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);


// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    /* jshint -W004 */
    Object.keys = function keys(object) {
        var isFunction = _toString(object) === '[object Function]',
            isObject = object !== null && typeof object === 'object';

        if (!isObject && !isFunction) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [],
            skipProto = hasProtoEnumBug && isFunction;
        for (var name in object) {
            if (!(skipProto && name === 'prototype') && owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                skipConstructor = ctor && ctor.prototype === object;
            for (var i = 0; i < dontEnumsLength; i++) {
                var dontEnum = dontEnums[i];
                if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };
}

if(!String.prototype.trim){
  String.prototype.trim = function (){
    return $.trim(this);
  }
}

if (!Array.prototype.map){
  Array.prototype.map = function(fn){
    return $.map(this, fn);
  }
}

// ECMA-262, 3rd B.2.3
// Note an ECMAScript standart, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
if ("".substr && "0b".substr(-1) !== "b") {
    var string_substr = String.prototype.substr;
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function(start, length) {
        return string_substr.call(
            this,
            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,
            length
        );
    }
}
},{"./jquery.js":45}],52:[function(require,module,exports){
var $ = require("./jquery.js");
/**  
  Weird token template renderer.
  "Tokens" look like {{namespace.name:attribute=value&attribute2=some other value}}.  
  Sometimes, a token is a simple substitution, sometimes it's a method call to pass a value.
 
  so given a string template
  "here is a value tag: {{token.number1}} and here is a method call tag: {{something.special:key=value}}""
  And mappings object:
  { 
    token:{
      number1:1
    },
    something:{
      special:function (attrs){
        return "special " + attrs.key;
      }
    }
  }
  You'd get "here is a value tag: 1 and here is a method call tag: special value"
*/
function tokenTemplate (template, mappings){
  var tokens = template.match(/\{\{.*?\}\}/g);
  if(!tokens){
    return template;
  }
  var swaps = {}
  $.each(tokens, function (i, token){
    var tok = token.match(/\{\{\s?(\w*)\.(\w*)\s?:?\s?(.*?)\}\}/);
    if(tok){
      var tokVal = tok[0];
      var namespace = tok[1];
      var name= tok[2];
      var attribs = tok[3] || "";
      if(!namespace || !name || !mappings[namespace] || !mappings[namespace][name]){
        return;
      }
      var thing = mappings[namespace][name];
      if(typeof thing == "function"){
        attribParts = attribs.split("&");
        var attribMap = {};
        $.each(attribParts, function (i, attr){
          var p = attr.split("=");
          if(p.length == 2){
            attribMap[$.trim(decodeURIComponent(p[0]))] = $.trim(decodeURIComponent(p[1]));
          }
        });
        swaps[tokVal] = thing(attribMap);
      }else{
        swaps[tokVal] = thing.toString();
      }
    }
  });
  var result = template;
  $.each(swaps, function (k, v){
    result = result.split(k).join(v);
  });
  return result;
}

module.exports = tokenTemplate;
},{"./jquery.js":45}],53:[function(require,module,exports){
var url = require("url");
var $ = require("./jquery.js");

function swapHostsProtocols(dest, source){
  if(!dest || !source){
    return dest;
  }
  dest = url.parse(dest);
  source = url.parse(source);
  dest.protocol = source.protocol;
  dest.host = source.host;
  return url.format(dest);
}

//This function takes a url like:
//http://whatever.mycustomercname.com/foobar.html?blah=whatever as dest
//and a url like:
//https://pod-name.marketo.com/lp/mycustomername/fizbuzz.html as source
//and creates a new url that preserves the customer source protocol, hostname, and partial path, like:
//https://pod-name.markteo.com/lp/mycustomername/foobar.html?blah=whatever

function remapLandingPageUrl(dest, source){
  if(!dest || !source){
    return dest;
  }
  dest = url.parse(dest);
  source = url.parse(source);
  dest.protocol = source.protocol;
  dest.host = source.host;
  destPathParts = dest.path.split("/");
  sourcePathParts = source.path.split("/");
  if(sourcePathParts[1] === "lp" && sourcePathParts.length >= 3 && destPathParts[1] !== "lp"){
    dest.pathname = sourcePathParts.slice(0, 3).join("/").concat(dest.pathname);
  }
  return url.format(dest);
}

function addQueryParams(u, params){
  var urlObj = url.parse(u, true);
  $.extend(urlObj.query, params);
  urlObj.search = "";
  u = url.format(urlObj);
  return u;
}

function removeQueryParams(u, params){
  if(!params){
    return u;
  }
  if(!$.isArray(params)){
    params = [""+params]
  }
  var urlObj = url.parse(u, true);
  $.each(params, function (i, param){
    delete urlObj.query[param];
  });
  urlObj.search = "";
  u = url.format(urlObj);
  return u;
}

module.exports = {
  swapHostsProtocols:swapHostsProtocols,
  addQueryParams:addQueryParams,
  removeQueryParams:removeQueryParams,
  remapLandingPageUrl:remapLandingPageUrl
};
},{"./jquery.js":45,"url":23}],54:[function(require,module,exports){
var $ = require("./jquery.js");
var $b = $.build;
var measure = require("./measure.js");
var modernizr = require("./modernizr.js");
var fh = require("./fields/fieldHelpers.js");

var Validation = function (formElem){
  var that = {};
  that.currentErrorElem = null;
  that.currentErrorMsg = null;
  var selector = ".mktoFieldDescriptor";

  that.checkOne = function(elem){
    var okRequired = true;
    var okValidator = true;
    var desc = elem.data("mktoFieldDescriptor");
    var val = desc.val();
    if(desc.required){
      if(desc.requiredValFn){
        okRequired = desc.requiredValFn(val);
      }else{
        okRequired = !! $.trim(val);
      }
    }
    if(desc.validator){
      okValidator = desc.validator(desc.val());
    }
    if(okRequired && okValidator && desc.validatorElem){
      desc.validatorElem.removeClass("mktoInvalid");
      desc.validatorElem.addClass("mktoValid");
      desc.validatorElem.removeAttr('aria-describedby');
      desc.validatorElem.attr("aria-invalid", "false");
    }
    else if(desc.validatorElem){
      desc.validatorElem.removeClass("mktoValid");
      desc.validatorElem.addClass("mktoInvalid");
      if (typeof desc.validatorElem.attr("aria-describedby") !== "undefined") {
        desc.validatorElem.attr("aria-invalid", "true");
      }
    }
    if(!okRequired){
      return desc.requiredMessage || desc.validationMessage || "This field is required";
    }
    if(!okValidator){
      return desc.validationMessage || "Validation failed";
    }
    return null;
  };

  that.checkOneAndHide = function (){
    var e = $(this);
    var msg = that.checkOne(e);
    if(!msg && that.currentErrorMsg){
      that.currentErrorMsg.fadeOut();  
    }      
  }

  that.checkOneAndShow = function (){
    var e = $(this);  
    if(e.data("mktoErrorShowBlocked")){
      return that.checkOneAndHide.call(this);
    }
    var validatorElem = e.data("mktoFieldDescriptor").validatorElem;
    var msg = that.checkOne(e);
    if(msg){
      if(that.currentErrorElem != e){
        if(that.currentErrorMsg){
          that.currentErrorMsg.fadeOut();
        }
        that.showError(validatorElem, msg);   
      }     
    }else{
      if(that.currentErrorMsg){
        that.currentErrorMsg.fadeOut();  
      }      
    }
  }

  that.initScoped = function (scope){
    var initFn = function (i, e){
      e = $(e);
      e.data("mktoErrorShowBlocked", true);
      var unblock = function (){
        e.data("mktoErrorShowBlocked", false);
        that.checkOneAndHide.call(this);
      }
      var filterDivTargets = function (next){
        return function (e){
          if(e.target.tagName.toLowerCase() != 'div'){
            next.apply(this, arguments);
          }
        }
      }
      // LM-90069: Multi-select checkboxes, the "required" feature (check at least one) needs special treatment
      if (e.find(".mktoLogicalField.mktoCheckboxList").length > 0) {
        e.on("focusout", filterDivTargets(unblock))
          .on("keyup", unblock)
          // LM-101548: Form required boolean checkbox fields ("This field is required") are not working.
          .on("click", that.checkOneAndHide);
        return;
      }
      e.on("focusin", filterDivTargets(that.checkOneAndShow))
        .on("focusout", filterDivTargets(unblock))
        .on("keyup", unblock)
        .on("click", that.checkOneAndHide);
    };
    scope.find(selector).each(initFn);
    if(scope.is(selector)){
      var e = scope.get(0); 
      initFn.call(e, 0, e);
    }
  }

  that.init = function (){
    that.clear();
    that.initScoped(formElem);
  }

  that.showError = function (elem, errorMsg){
    if(that.currentErrorMsg){
      that.currentErrorMsg.remove();
    }
    var arrowWrap;
    var elemName;
    if (typeof elem[0].name !== "undefined" || (elem[0].childNodes[0] && typeof elem[0].childNodes[0].name !== "undefined")) {
      elemName = typeof elem[0].name !== "undefined" ? elem[0].name : elem[0].childNodes[0].name;
    }
    var errorBox = $b(".mktoError", [
      arrowWrap = $b(".mktoErrorArrowWrap",[$b(".mktoErrorArrow")]),
      $b(".mktoErrorMsg", {"id":fh.getValidationMsgId(elemName), "role":"alert", "tabindex":"-1"}, $b.html(errorMsg))
    ]).hide();

    if(!modernizr.csstransforms){
      arrowWrap.addClass("mktoArrowImage");
    }

    elem.after(errorBox);
    elem.attr('aria-describedby', fh.getValidationMsgId(elemName));
    that.currentErrorElem = elem;
    that.currentErrorMsg = errorBox;
    var dims = measure.measure(errorBox);
    var right;
    var ow = elem.outerWidth();
    if( ow < dims.w){
      right = -1 * (dims.w - ow); 
    }else{
      right = (ow - dims.w) / 2;
    }
    errorBox.css({
      right: right,
      bottom: -1 * dims.h
    })
    errorBox.fadeIn();
  };

  that.check = function (){
    that.clear();
    var firstError = null;
    formElem.find(selector).each(function (){
      var e = $(this);
      e.data("mktoErrorShowBlocked", false);
      var errorMsg = that.checkOne(e);
      if(errorMsg && !firstError){
        firstError = e;
      }
    })
    if(firstError){
      var desc = firstError.data("mktoFieldDescriptor");
      var errorElem = desc.validatorFocusElem || desc.validatorElem;
      if(errorElem){
        setTimeout(function (){
          errorElem.focus();
          // LM-101548: Form required boolean checkbox fields ("This field is required") are not working.
          // Only for checkboxs (single or multi), conduct 'checkOneAndShow' at submit time, instead of using 'focusin'
          if (firstError.find(".mktoLogicalField.mktoCheckboxList").length > 0) {
            that.checkOneAndShow.call(firstError);
          }
        }, 10);
      }
      return false;
    }
    return true;
  };

  that.clear = function (){
    that.currentErrorElem = null;
    that.currentErrorMsg = null;
    formElem.find(".mktoInvalid").removeClass("mktoInvalid");
    formElem.find(".mktoValid").removeClass("mktoValid"); 
    formElem.find(".mktoError").remove(); 
  };
  return that;
}

module.exports = Validation
},{"./fields/fieldHelpers.js":29,"./jquery.js":45,"./measure.js":46,"./modernizr.js":48}],55:[function(require,module,exports){
// yepnope.js
// Version - 1.5.4pre
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//
( function ( window, doc, undef ) {

var docElement            = doc.documentElement,
    sTimeout              = window.setTimeout,
    firstScript           = doc.getElementsByTagName( "script" )[ 0 ],
    toString              = {}.toString,
    execStack             = [],
    started               = 0,
    noop                  = function () {},
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko               = ( "MozAppearance" in docElement.style ),
    isGeckoLTE18          = isGecko && !! doc.createRange().compareNode,
    insBeforeObj          = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera               = window.opera && toString.call( window.opera ) == "[object Opera]",
    isIE                  = !! doc.attachEvent && !isOpera,
    // isOlderWebkit fix for #95 - https://github.com/SlexAxton/yepnope.js/issues/95
    isOlderWebkit		  = ( 'webkitAppearance' in docElement.style ) && !( 'async' in doc.createElement('script') ),
    strJsElem             = isGecko ? "object" : (isIE || isOlderWebkit)  ? "script" : "img",
    strCssElem            = isIE ? "script" : (isOlderWebkit) ? "img" : strJsElem,
    isArray               = Array.isArray || function ( obj ) {
      return toString.call( obj ) == "[object Array]";
    },
    isObject              = function ( obj ) {
      return Object(obj) === obj;
    },
    isString              = function ( s ) {
      return typeof s == "string";
    },
    isFunction            = function ( fn ) {
      return toString.call( fn ) == "[object Function]";
    },
    readFirstScript       = function() {
        if (!firstScript || !firstScript.parentNode) {
            firstScript = doc.getElementsByTagName( "script" )[ 0 ];
        }
    },
    globalFilters         = [],
    scriptCache           = {},
    prefixes              = {
      // key value pair timeout options
      timeout : function( resourceObj, prefix_parts ) {
        if ( prefix_parts.length ) {
          resourceObj['timeout'] = prefix_parts[ 0 ];
        }
        return resourceObj;
      }
    },
    handler,
    yepnope;

  /* Loader helper functions */
  function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == "loaded" || readyState == "complete" || readyState == "uninitialized" );
  }


  // Takes a preloaded js obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  function injectJs ( src, cb, attrs, timeout, /* internal use */ err, internal ) {
	  
    var script = doc.createElement( "script" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    script.src = src;

    // Add our extra attributes to the script element
    for ( i in attrs ) {
        script.setAttribute( i, attrs[ i ] );
    }

    cb = internal ? executeStack : ( cb || noop );

    // Bind to load events
    script.onreadystatechange = script.onload = function () {

      if ( ! done && isFileReady( script.readyState ) ) {

        // Set done to prevent this function from being called twice.
        done = 1;
        cb();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };

    // 404 Fallback
    setTimeout(function () {
      if ( ! done ) {
        done = 1;
        // Might as well pass in an error-state if we fire the 404 fallback
        cb(1);
      }
    }, timeout );

    // Inject script into to document
    // or immediately callback if we know there
    // was previously a timeout error
    readFirstScript();
    err ? script.onload() : firstScript.parentNode.insertBefore( script, firstScript );
  }

  // Takes a preloaded css obj (changes in different browsers) and injects it into the head
  function injectCss ( href, cb, attrs, timeout, /* Internal use */ err, internal ) {

    // Create stylesheet link
    var link = doc.createElement( "link" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    cb = internal ? executeStack : ( cb || noop );

    // Add attributes
    link.href = href;
    link.rel  = "stylesheet";
    link.type = "text/css";

    // Add our extra attributes to the link element
    for ( i in attrs ) {
      link.setAttribute( i, attrs[ i ] );
    }

    if ( ! err ) {
      readFirstScript();
      firstScript.parentNode.insertBefore( link, firstScript );
      setTimeout(cb, 0);
    }
  }

  function executeStack ( ) {
    // shift an element off of the stack
    var i   = execStack.shift();
    started = 1;

    // if a is truthy and the first item in the stack has an src
    if ( i ) {
      // if it's a script, inject it into the head with no type attribute
      if ( i['t'] ) {
        // Inject after a timeout so FF has time to be a jerk about it and
        // not double load (ignore the cache)
        setTimeout( function () {
          (i['t'] == "c" ?  yepnope['injectCss'] : yepnope['injectJs'])( i['s'], 0, i['a'], i['x'], i['e'], 1 );
        }, 0 );
      }
      // Otherwise, just call the function and potentially run the stack
      else {
        i();
        executeStack();
      }
    }
    else {
      // just reset out of recursive mode
      started = 0;
    }
  }

  function preloadFile ( elem, url, type, splicePoint, dontExec, attrObj, timeout ) {

    timeout = timeout || yepnope['errorTimeout'];

    // Create appropriate element for browser and type
    var preloadElem = doc.createElement( elem ),
        done        = 0,
        firstFlag   = 0,
        stackObject = {
          "t": type,     // type
          "s": url,      // src
        //r: 0,        // ready
          "e": dontExec,// set to true if we don't want to reinject
          "a": attrObj,
          "x": timeout
        };

    // The first time (common-case)
    if ( scriptCache[ url ] === 1 ) {
      firstFlag = 1;
      scriptCache[ url ] = [];
    }

    function onload ( first ) {
      // If the script/css file is loaded
      if ( ! done && isFileReady( preloadElem.readyState ) ) {

        // Set done to prevent this function from being called twice.
        stackObject['r'] = done = 1;

        ! started && executeStack();

        if ( first ) {
          if ( elem != "img" ) {
            setTimeout(function(){ insBeforeObj.removeChild( preloadElem ) }, 50);
          }

          for ( var i in scriptCache[ url ] ) {
            if ( scriptCache[ url ].hasOwnProperty( i ) ) {
              scriptCache[ url ][ i ].onload();
            }
          }
          
          // Handle memory leak in IE
           preloadElem.onload = preloadElem.onreadystatechange = null;
        }
      }
    }


    // Setting url to data for objects or src for img/scripts
    if ( elem == "object" ) {
      preloadElem.data = url;
	  
      // Setting the type attribute to stop Firefox complaining about the mimetype when running locally.
      // The type doesn't matter as long as it's real, thus text/css instead of text/javascript.
      preloadElem.setAttribute("type", "text/css");
    } else {
      preloadElem.src = url;

      // Setting bogus script type to allow the script to be cached
      preloadElem.type = elem;
    }

    // Don't let it show up visually
    preloadElem.width = preloadElem.height = "0";

    // Attach handlers for all browsers
    preloadElem.onerror = preloadElem.onload = preloadElem.onreadystatechange = function(){
      onload.call(this, firstFlag);
    };
    // inject the element into the stack depending on if it's
    // in the middle of other scripts or not
    execStack.splice( splicePoint, 0, stackObject );

    // The only place these can't go is in the <head> element, since objects won't load in there
    // so we have two options - insert before the head element (which is hard to assume) - or
    // insertBefore technically takes null/undefined as a second param and it will insert the element into
    // the parent last. We try the head, and it automatically falls back to undefined.
    if ( elem != "img" ) {
      // If it's the first time, or we've already loaded it all the way through
      if ( firstFlag || scriptCache[ url ] === 2 ) {
        readFirstScript();
        insBeforeObj.insertBefore( preloadElem, isGeckoLTE18 ? null : firstScript );

        // If something fails, and onerror doesn't fire,
        // continue after a timeout.
        setTimeout( onload, timeout );
      }
      else {
        // instead of injecting, just hold on to it
        scriptCache[ url ].push( preloadElem );
      }
    }
  }

  function load ( resource, type, dontExec, attrObj, timeout ) {
    // If this method gets hit multiple times, we should flag
    // that the execution of other threads should halt.
    started = 0;

    // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
    type = type || "j";
    if ( isString( resource ) ) {
      // if the resource passed in here is a string, preload the file
      preloadFile( type == "c" ? strCssElem : strJsElem, resource, type, this['i']++, dontExec, attrObj, timeout );
    } else {
      // Otherwise it's a callback function and we can splice it into the stack to run
      execStack.splice( this['i']++, 0, resource );
      execStack.length == 1 && executeStack();
    }

    // OMG is this jQueries? For chaining...
    return this;
  }

  // return the yepnope object with a fresh loader attached
  function getYepnope () {
    var y = yepnope;
    y['loader'] = {
      "load": load,
      "i" : 0
    };
    return y;
  }

  /* End loader helper functions */
  // Yepnope Function
  yepnope = function ( needs ) {

    var i,
        need,
        // start the chain as a plain instance
        chain = yepnope.loader;

    function satisfyPrefixes ( url ) {
      // split all prefixes out
      var parts   = url.split( "!" ),
      gLen    = globalFilters.length,
      origUrl = parts.pop(),
      pLen    = parts.length,
      res     = {
        "url"      : origUrl,
        // keep this one static for callback variable consistency
        "origUrl"  : origUrl,
        "prefixes" : parts
      },
      mFunc,
      j,
      prefix_parts;

      // loop through prefixes
      // if there are none, this automatically gets skipped
      for ( j = 0; j < pLen; j++ ) {
        prefix_parts = parts[ j ].split( '=' );
        mFunc = prefixes[ prefix_parts.shift() ];
        if ( mFunc ) {
          res = mFunc( res, prefix_parts );
        }
      }

      // Go through our global filters
      for ( j = 0; j < gLen; j++ ) {
        res = globalFilters[ j ]( res );
      }

      // return the final url
      return res;
    }

     function getExtension ( url ) {
      //The extension is always the last characters before the ? and after a period.
      //The previous method was not accounting for the possibility of a period in the query string.
      var b = url.split('?')[0];
      return b.substr(b.lastIndexOf('.')+1);
    }

    function loadScriptOrStyle ( input, callback, chain, index, testResult ) {
      // run through our set of prefixes
      var resource     = satisfyPrefixes( input ),
          autoCallback = resource['autoCallback'],
          extension    = getExtension( resource['url'] );

      // if no object is returned or the url is empty/0 just exit the load
      if ( resource['bypass'] ) {
        return;
      }

      // Determine callback, if any
      if ( callback ) {
        callback = isFunction( callback ) ?
          callback :
          callback[ input ] ||
          callback[ index ] ||
          callback[ ( input.split( "/" ).pop().split( "?" )[ 0 ] ) ];
      }

      // if someone is overriding all normal functionality
      if ( resource['instead'] ) {
        return resource['instead']( input, callback, chain, index, testResult );
      }
      else {
        // Handle if we've already had this url and it's completed loaded already
        if ( scriptCache[ resource['url'] ] && resource['reexecute'] !== true) {
          // don't let this execute again
          resource['noexec'] = true;
        }
        else {
          scriptCache[ resource['url'] ] = 1;
        }

        // Throw this into the queue
        input && chain.load( resource['url'], ( ( resource['forceCSS'] || ( ! resource['forceJS'] && "css" == getExtension( resource['url'] ) ) ) ) ? "c" : undef, resource['noexec'], resource['attrs'], resource['timeout'] );

        // If we have a callback, we'll start the chain over
        if ( isFunction( callback ) || isFunction( autoCallback ) ) {
          // Call getJS with our current stack of things
          chain['load']( function () {
            // Hijack yepnope and restart index counter
            getYepnope();
            // Call our callbacks with this set of data
            callback && callback( resource['origUrl'], testResult, index );
            autoCallback && autoCallback( resource['origUrl'], testResult, index );

            // Override this to just a boolean positive
            scriptCache[ resource['url'] ] = 2;
          } );
        }
      }
    }

    function loadFromTestObject ( testObject, chain ) {
        var testResult = !! testObject['test'],
            group      = testResult ? testObject['yep'] : testObject['nope'],
            always     = testObject['load'] || testObject['both'],
            callback   = testObject['callback'] || noop,
            cbRef      = callback,
            complete   = testObject['complete'] || noop,
            needGroupSize,
            callbackKey;
            
        // Reusable function for dealing with the different input types
        // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
        // much smaller than the functional equivalent in this case.
        function handleGroup ( needGroup, moreToCome ) {
          if ( '' !== needGroup && ! needGroup ) {
            // Call the complete callback when there's nothing to load.
            ! moreToCome && complete();
          }
          // If it's a string
          else if ( isString( needGroup ) ) {
            // if it's a string, it's the last
            if ( !moreToCome ) {
              // Add in the complete callback to go at the end
              callback = function () {
                var args = [].slice.call( arguments );
                cbRef.apply( this, args );
                complete();
              };
            }
            // Just load the script of style
            loadScriptOrStyle( needGroup, callback, chain, 0, testResult );
          }
          // See if we have an object. Doesn't matter if it's an array or a key/val hash
          // Note:: order cannot be guaranteed on an key value object with multiple elements
          // since the for-in does not preserve order. Arrays _should_ go in order though.
          else if ( isObject( needGroup ) ) {
            // I hate this, but idk another way for objects.
            needGroupSize = (function(){
              var count = 0, i
              for (i in needGroup ) {
                if ( needGroup.hasOwnProperty( i ) ) {
                  count++;
                }
              }
              return count;
            })();

            for ( callbackKey in needGroup ) {
              // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
              // patch if needed. Kangax has a nice shim for it. Or just remove the check
              // and promise not to extend the object prototype.
              if ( needGroup.hasOwnProperty( callbackKey ) ) {
                // Find the last added resource, and append to it's callback.
                if ( ! moreToCome && ! ( --needGroupSize ) ) {
                  // If this is an object full of callbacks
                  if ( ! isFunction( callback ) ) {
                    // Add in the complete callback to go at the end
                    callback[ callbackKey ] = (function( innerCb ) {
                      return function () {
                        var args = [].slice.call( arguments );
                        innerCb && innerCb.apply( this, args );
                        complete();
                      };
                    })( cbRef[ callbackKey ] );
                  }
                  // If this is just a single callback
                  else {
                    callback = function () {
                      var args = [].slice.call( arguments );
                      cbRef.apply( this, args );
                      complete();
                    };
                  }
                }
                loadScriptOrStyle( needGroup[ callbackKey ], callback, chain, callbackKey, testResult );
              }
            }
          }
        }

        // figure out what this group should do
        handleGroup( group, !!always || !!testObject['complete']);

        // Run our loader on the load/both group too
        // the always stuff always loads second.
        always && handleGroup( always );

	// If complete callback is used without loading anything
        !always && !!testObject['complete'] && handleGroup('');

    }

    // Someone just decides to load a single script or css file as a string
    if ( isString( needs ) ) {
      loadScriptOrStyle( needs, 0, chain, 0 );
    }
    // Normal case is likely an array of different types of loading options
    else if ( isArray( needs ) ) {
      // go through the list of needs
      for( i = 0; i < needs.length; i++ ) {
        need = needs[ i ];

        // if it's a string, just load it
        if ( isString( need ) ) {
          loadScriptOrStyle( need, 0, chain, 0 );
        }
        // if it's an array, call our function recursively
        else if ( isArray( need ) ) {
          yepnope( need );
        }
        // if it's an object, use our modernizr logic to win
        else if ( isObject( need ) ) {
          loadFromTestObject( need, chain );
        }
      }
    }
    // Allow a single object to be passed in
    else if ( isObject( needs ) ) {
      loadFromTestObject( needs, chain );
    }
  };

  // This publicly exposed function is for allowing
  // you to add functionality based on prefixes on the
  // string files you add. 'css!' is a builtin prefix
  //
  // The arguments are the prefix (not including the !) as a string
  // and
  // A callback function. This function is passed a resource object
  // that can be manipulated and then returned. (like middleware. har.)
  //
  // Examples of this can be seen in the officially supported ie prefix
  yepnope['addPrefix'] = function ( prefix, callback ) {
    prefixes[ prefix ] = callback;
  };

  // A filter is a global function that every resource
  // object that passes through yepnope will see. You can
  // of course conditionally choose to modify the resource objects
  // or just pass them along. The filter function takes the resource
  // object and is expected to return one.
  //
  // The best example of a filter is the 'autoprotocol' officially
  // supported filter
  yepnope['addFilter'] = function ( filter ) {
    globalFilters.push( filter );
  };

  // Default error timeout to 10sec - modify to alter
  yepnope['errorTimeout'] = 1e4;

  // Webreflection readystate hack
  // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
  // if the readyState is null and we have a listener
  if ( doc.readyState == null && doc.addEventListener ) {
    // set the ready state to loading
    doc.readyState = "loading";
    // call the listener
    doc.addEventListener( "DOMContentLoaded", handler = function () {
      // Remove the listener
      doc.removeEventListener( "DOMContentLoaded", handler, 0 );
      // Set it to ready
      doc.readyState = "complete";
    }, 0 );
  }

  // Attach loader &
  // Leak it

  module.exports = getYepnope();

  // Exposing executeStack to better facilitate plugins
  module.exports['executeStack'] = executeStack;
  module.exports['injectJs'] = injectJs;
  module.exports['injectCss'] = injectCss;

})( this, document );
},{}]},{},[43]);
