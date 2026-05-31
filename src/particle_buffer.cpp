#include <cstdint>

class ParticleBuffer {
    uint32_t* buffer;
    size_t capacity;
    size_t count;
public:
    ParticleBuffer(size_t cap) : buffer(new uint32_t[cap]), capacity(cap), count(0) {}
    ~ParticleBuffer() { delete[] buffer; }
    bool push(uint32_t particle) {
        if (count >= capacity) return false;
        buffer[count++] = particle;
        return true;
    }
    size_t size() const { return count; }
};