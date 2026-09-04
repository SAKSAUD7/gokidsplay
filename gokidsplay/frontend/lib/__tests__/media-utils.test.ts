import { describe, it, expect } from 'vitest'
import { getMediaUrl } from '../media-utils'

describe('getMediaUrl', () => {
    it('should return empty string for null or undefined', () => {
        expect(getMediaUrl(null)).toBe('')
        expect(getMediaUrl(undefined)).toBe('')
    })

    it('should return absolute URLs unchanged', () => {
        expect(getMediaUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
        expect(getMediaUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
    })

    it('should convert relative media URLs to absolute', () => {
        const result = getMediaUrl('/media/uploads/image.jpg')
        expect(result).toContain('http://localhost:9000')
        expect(result).toContain('/media/uploads/image.jpg')
    })

    it('should handle media URLs without leading slash', () => {
        const result = getMediaUrl('media/uploads/image.jpg')
        expect(result).toContain('http://localhost:9000')
        expect(result).toContain('/media/uploads/image.jpg')
    })

    it('should return other relative URLs unchanged', () => {
        expect(getMediaUrl('/images/local.jpg')).toBe('/images/local.jpg')
        expect(getMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    })
})
