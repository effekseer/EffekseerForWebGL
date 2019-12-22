




class BinaryReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }

    returnBack(size)
    {
        this.offset -= size;
    }

    getInt32() {
        var ret = new DataView(this.buffer, this.offset, 4).getInt32(0, true);
        this.offset += 4;
        return ret;
    }

    getChunk4() {
        var sliced = new Uint8Array(this.buffer.slice(this.offset, this.offset + 4));
        var ret = String.fromCharCode(sliced[0], sliced[1], sliced[2], sliced[3]);
        this.offset += 4;
        return ret;
    }

    getStringAsUTF16() {
        var size = new DataView(this.buffer, this.offset, 4).getInt32(0, true);
        this.offset += 4;
        var sliced = new Uint8Array(this.buffer.slice(this.offset, this.offset + (size * 2 - 2)));

        var str = "";
        for(var i = 0; i < sliced.byteLength / 2; i++) {
            str += String.fromCharCode(sliced[i * 2] + sliced[i * 2 + 1] * 256);
        }

        this.offset += (size * 2);
        return str;
    }

    isEoF() {
        return this.offset >= this.buffer.byteLength;
    }

    skip(num) {
        this.offset += num;
    }
}

class EfkEfcProperty {
    constructor() {
        this.colorImages = []
        this.normalImages = []
        this.distortionImages = []
        this.models = []
        this.sounds = []
        this.materials = []
    }
}

function loadEfkEfcInformation(buffer) {
    function readStringArray(reader) {
        var ret = []

        var count = reader.getInt32();
        for (var i = 0; i < count; i++) {
            var str = reader.getStringAsUTF16();
            ret.push(str)
        }

        return ret;
    }

    var reader = new BinaryReader(buffer);

    var header = reader.getChunk4();
    var version = reader.getInt32();

    while (!reader.isEoF()) {
        var chunk = reader.getChunk4();
        var chunkSize = reader.getInt32();

        if (chunk == "INFO") {
            var info = new EfkEfcProperty();

            version = reader.getInt32();
            if(version >= 1500)
            {
            }
            else
            {
                reader.returnBack(4);
                version = 0;
            }

            info.colorImages = readStringArray(reader);
            info.normalImages = readStringArray(reader);
            info.distortionImages = readStringArray(reader);
            info.models = readStringArray(reader);
            info.sounds = readStringArray(reader);

            if(version >= 1500)
            {
                info.materials = readStringArray(reader);
            }

            return info;
        }
        else {
            reader.skip(chunkSize);
        }
    }

    return null;
}