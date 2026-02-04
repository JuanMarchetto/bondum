// polyfill.js
import { install } from 'react-native-quick-crypto'
import { Buffer } from 'buffer'
import process from 'process/browser'

// Install quick-crypto as the global crypto
install()

// Polyfill Buffer globally
global.Buffer = Buffer

// Polyfill process globally
global.process = process
