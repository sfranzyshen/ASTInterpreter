#include "ArduinoDataTypes.hpp"
#include <sstream>
#include <stdexcept>

namespace arduino_interpreter {

// =============================================================================
// ARDUINO STRUCT IMPLEMENTATION
// =============================================================================

ArduinoStruct::ArduinoStruct(const std::string& typeName) : typeName_(typeName) {
}

bool ArduinoStruct::hasMember(const std::string& name) const {
    return members_.find(name) != members_.end();
}

EnhancedCommandValue ArduinoStruct::getMember(const std::string& name) const {
    auto it = members_.find(name);
    if (it != members_.end()) {
        return it->second;
    }
    return std::monostate{}; // Return undefined for non-existent members
}

void ArduinoStruct::setMember(const std::string& name, const EnhancedCommandValue& value) {
    members_[name] = value;
}

std::string ArduinoStruct::toString() const {
    std::ostringstream oss;
    oss << typeName_ << " { ";
    bool first = true;
    for (const auto& [name, value] : members_) {
        if (!first) oss << ", ";
        oss << name << ": " << enhancedCommandValueToString(value);
        first = false;
    }
    oss << " }";
    return oss.str();
}

// =============================================================================
// ARDUINO POINTER IMPLEMENTATION
// =============================================================================

ArduinoPointer::ArduinoPointer(EnhancedCommandValue* target, 
                               const std::string& targetType, 
                               size_t level) 
    : target_(target), targetType_(targetType), pointerLevel_(level) {
}

EnhancedCommandValue ArduinoPointer::dereference() const {
    if (isNull()) {
        throw std::runtime_error("Cannot dereference null pointer");
    }
    return *target_;
}

void ArduinoPointer::assign(EnhancedCommandValue* newTarget) {
    target_ = newTarget;
}

ArduinoPointer ArduinoPointer::operator+(int offset) const {
    // For now, basic implementation - could be enhanced for actual memory arithmetic
    return ArduinoPointer(target_, targetType_, pointerLevel_);
}

ArduinoPointer ArduinoPointer::operator-(int offset) const {
    // For now, basic implementation - could be enhanced for actual memory arithmetic
    return ArduinoPointer(target_, targetType_, pointerLevel_);
}

std::string ArduinoPointer::toString() const {
    std::ostringstream oss;
    oss << targetType_;
    for (size_t i = 0; i < pointerLevel_; ++i) {
        oss << "*";
    }
    oss << " @ " << (void*)target_;
    return oss.str();
}

// =============================================================================
// ARDUINO ARRAY IMPLEMENTATION
// =============================================================================

ArduinoArray::ArduinoArray(const std::string& elementType, 
                           const std::vector<size_t>& dimensions) 
    : elementType_(elementType), dimensions_(dimensions) {
    
    // Calculate total size for multi-dimensional arrays
    size_t totalSize = 1;
    for (size_t dim : dimensions_) {
        totalSize *= dim;
    }
    elements_.resize(totalSize);
}

EnhancedCommandValue ArduinoArray::getElement(size_t index) const {
    if (index >= elements_.size()) {
        throw std::out_of_range("Array index out of bounds");
    }
    return elements_[index];
}

void ArduinoArray::setElement(size_t index, const EnhancedCommandValue& value) {
    if (index >= elements_.size()) {
        throw std::out_of_range("Array index out of bounds");
    }
    elements_[index] = value;
}

EnhancedCommandValue ArduinoArray::getElement(const std::vector<size_t>& indices) const {
    size_t flatIndex = 0;
    size_t multiplier = 1;
    
    // Convert multi-dimensional indices to flat index
    for (int i = dimensions_.size() - 1; i >= 0; --i) {
        if (i >= (int)indices.size() || indices[i] >= dimensions_[i]) {
            throw std::out_of_range("Multi-dimensional array index out of bounds");
        }
        flatIndex += indices[i] * multiplier;
        multiplier *= dimensions_[i];
    }
    
    return getElement(flatIndex);
}

void ArduinoArray::setElement(const std::vector<size_t>& indices, const EnhancedCommandValue& value) {
    size_t flatIndex = 0;
    size_t multiplier = 1;
    
    // Convert multi-dimensional indices to flat index
    for (int i = dimensions_.size() - 1; i >= 0; --i) {
        if (i >= (int)indices.size() || indices[i] >= dimensions_[i]) {
            throw std::out_of_range("Multi-dimensional array index out of bounds");
        }
        flatIndex += indices[i] * multiplier;
        multiplier *= dimensions_[i];
    }
    
    setElement(flatIndex, value);
}

void ArduinoArray::resize(size_t newSize, const EnhancedCommandValue& defaultValue) {
    elements_.resize(newSize, defaultValue);
}

void ArduinoArray::resizeMultiDimensional(const std::vector<size_t>& newDimensions, const EnhancedCommandValue& defaultValue) {
    dimensions_ = newDimensions;
    
    // Calculate total size for new dimensions
    size_t totalSize = 1;
    for (size_t dim : dimensions_) {
        totalSize *= dim;
    }
    
    elements_.resize(totalSize, defaultValue);
}

size_t ArduinoArray::getDimensionSize(size_t dimensionIndex) const {
    if (dimensionIndex < dimensions_.size()) {
        return dimensions_[dimensionIndex];
    }
    return 0;
}

bool ArduinoArray::isValidIndices(const std::vector<size_t>& indices) const {
    if (indices.size() != dimensions_.size()) {
        return false;
    }
    
    for (size_t i = 0; i < indices.size(); ++i) {
        if (indices[i] >= dimensions_[i]) {
            return false;
        }
    }
    
    return true;
}

size_t ArduinoArray::calculateFlatIndex(const std::vector<size_t>& indices) const {
    if (!isValidIndices(indices)) {
        throw std::out_of_range("Invalid multi-dimensional array indices");
    }
    
    size_t flatIndex = 0;
    size_t multiplier = 1;
    
    // Convert multi-dimensional indices to flat index
    for (int i = dimensions_.size() - 1; i >= 0; --i) {
        flatIndex += indices[i] * multiplier;
        multiplier *= dimensions_[i];
    }
    
    return flatIndex;
}

std::vector<size_t> ArduinoArray::calculateMultiDimensionalIndex(size_t flatIndex) const {
    if (flatIndex >= elements_.size()) {
        throw std::out_of_range("Flat index out of bounds for multi-dimensional array");
    }
    
    std::vector<size_t> indices(dimensions_.size());
    
    for (int i = dimensions_.size() - 1; i >= 0; --i) {
        indices[i] = flatIndex % dimensions_[i];
        flatIndex /= dimensions_[i];
    }
    
    return indices;
}

std::string ArduinoArray::toString() const {
    std::ostringstream oss;
    oss << elementType_ << "[";
    for (size_t i = 0; i < dimensions_.size(); ++i) {
        if (i > 0) oss << "][";
        oss << dimensions_[i];
    }
    oss << "] { ";
    
    for (size_t i = 0; i < std::min(elements_.size(), size_t(5)); ++i) {
        if (i > 0) oss << ", ";
        oss << enhancedCommandValueToString(elements_[i]);
    }
    if (elements_.size() > 5) {
        oss << ", ... (" << elements_.size() << " total)";
    }
    oss << " }";
    return oss.str();
}

// =============================================================================
// ARDUINO STRING IMPLEMENTATION
// =============================================================================

ArduinoString::ArduinoString(const std::string& str) : data_(str) {
}

char ArduinoString::charAt(size_t index) const {
    if (index >= data_.length()) {
        return '\0';  // Arduino String behavior
    }
    return data_[index];
}

void ArduinoString::setCharAt(size_t index, char c) {
    if (index < data_.length()) {
        data_[index] = c;
    }
}

ArduinoString ArduinoString::substring(size_t start, size_t end) const {
    if (end == std::string::npos) {
        end = data_.length();
    }
    if (start >= data_.length()) {
        return ArduinoString("");
    }
    if (end > data_.length()) {
        end = data_.length();
    }
    if (start >= end) {
        return ArduinoString("");
    }
    return ArduinoString(data_.substr(start, end - start));
}

int ArduinoString::indexOf(const std::string& str, size_t start) const {
    size_t pos = data_.find(str, start);
    return (pos == std::string::npos) ? -1 : static_cast<int>(pos);
}

int ArduinoString::lastIndexOf(const std::string& str, size_t start) const {
    size_t pos = data_.rfind(str, start);
    return (pos == std::string::npos) ? -1 : static_cast<int>(pos);
}

bool ArduinoString::startsWith(const std::string& str) const {
    return data_.substr(0, str.length()) == str;
}

bool ArduinoString::endsWith(const std::string& str) const {
    if (str.length() > data_.length()) return false;
    return data_.substr(data_.length() - str.length()) == str;
}

ArduinoString ArduinoString::toLowerCase() const {
    std::string result = data_;
    for (char& c : result) {
        c = std::tolower(c);
    }
    return ArduinoString(result);
}

ArduinoString ArduinoString::toUpperCase() const {
    std::string result = data_;
    for (char& c : result) {
        c = std::toupper(c);
    }
    return ArduinoString(result);
}

int ArduinoString::toInt() const {
    try {
        return std::stoi(data_);
    } catch (...) {
        return 0;  // Arduino String behavior
    }
}

double ArduinoString::toFloat() const {
    try {
        return std::stod(data_);
    } catch (...) {
        return 0.0;  // Arduino String behavior
    }
}

ArduinoString ArduinoString::operator+(const ArduinoString& other) const {
    return ArduinoString(data_ + other.data_);
}

ArduinoString& ArduinoString::operator+=(const ArduinoString& other) {
    data_ += other.data_;
    return *this;
}

ArduinoString& ArduinoString::operator+=(const std::string& other) {
    data_ += other;
    return *this;
}

ArduinoString ArduinoString::trim() const {
    std::string result = data_;
    
    // Trim leading whitespace
    size_t start = result.find_first_not_of(" \t\n\r\f\v");
    if (start == std::string::npos) {
        return ArduinoString("");  // String is all whitespace
    }
    
    // Trim trailing whitespace
    size_t end = result.find_last_not_of(" \t\n\r\f\v");
    
    return ArduinoString(result.substr(start, end - start + 1));
}

ArduinoString ArduinoString::replace(const std::string& find, const std::string& replace) const {
    std::string result = data_;
    size_t pos = 0;
    
    while ((pos = result.find(find, pos)) != std::string::npos) {
        result.replace(pos, find.length(), replace);
        pos += replace.length();
    }
    
    return ArduinoString(result);
}

bool ArduinoString::operator==(const ArduinoString& other) const {
    return data_ == other.data_;
}

bool ArduinoString::operator!=(const ArduinoString& other) const {
    return data_ != other.data_;
}

bool ArduinoString::operator<(const ArduinoString& other) const {
    return data_ < other.data_;
}

bool ArduinoString::operator<=(const ArduinoString& other) const {
    return data_ <= other.data_;
}

bool ArduinoString::operator>(const ArduinoString& other) const {
    return data_ > other.data_;
}

bool ArduinoString::operator>=(const ArduinoString& other) const {
    return data_ >= other.data_;
}

// =============================================================================
// UTILITY FUNCTION IMPLEMENTATIONS
// =============================================================================

EnhancedCommandValue upgradeCommandValue(const std::variant<std::monostate, bool, int32_t, double, std::string>& basic) {
    return std::visit([](auto&& arg) -> EnhancedCommandValue {
        return arg;  // Direct conversion works for shared types
    }, basic);
}

std::variant<std::monostate, bool, int32_t, double, std::string> downgradeCommandValue(const EnhancedCommandValue& enhanced) {
    return std::visit([](auto&& arg) -> std::variant<std::monostate, bool, int32_t, double, std::string> {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, std::monostate> || 
                      std::is_same_v<T, bool> || 
                      std::is_same_v<T, int32_t> || 
                      std::is_same_v<T, double> || 
                      std::is_same_v<T, std::string>) {
            return arg;  // Direct conversion for basic types
        } else {
            // Convert complex types to strings
            if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoStruct>>) {
                return arg ? arg->toString() : std::string("null_struct");
            } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoString>>) {
                return arg ? arg->c_str() : std::string("");
            } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoArray>>) {
                return arg ? arg->toString() : std::string("null_array");
            } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoPointer>>) {
                return arg ? arg->toString() : std::string("null_pointer");
            } else {
                return std::string("unknown_type");
            }
        }
    }, enhanced);
}

bool isStructType(const EnhancedCommandValue& value) {
    return std::holds_alternative<std::shared_ptr<ArduinoStruct>>(value);
}

bool isPointerType(const EnhancedCommandValue& value) {
    return std::holds_alternative<std::shared_ptr<ArduinoPointer>>(value);
}

bool isArrayType(const EnhancedCommandValue& value) {
    return std::holds_alternative<std::shared_ptr<ArduinoArray>>(value);
}

bool isStringType(const EnhancedCommandValue& value) {
    return std::holds_alternative<std::shared_ptr<ArduinoString>>(value);
}

std::string enhancedCommandValueToString(const EnhancedCommandValue& value) {
    return std::visit([](auto&& arg) -> std::string {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, std::monostate>) {
            return "undefined";
        } else if constexpr (std::is_same_v<T, bool>) {
            return arg ? "true" : "false";
        } else if constexpr (std::is_same_v<T, int32_t>) {
            return std::to_string(arg);
        } else if constexpr (std::is_same_v<T, double>) {
            return std::to_string(arg);
        } else if constexpr (std::is_same_v<T, std::string>) {
            return "\"" + arg + "\"";
        } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoStruct>>) {
            return arg ? arg->toString() : "null_struct";
        } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoString>>) {
            return arg ? ("\"" + arg->c_str() + "\"") : "null_string";
        } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoArray>>) {
            return arg ? arg->toString() : "null_array";
        } else if constexpr (std::is_same_v<T, std::shared_ptr<ArduinoPointer>>) {
            return arg ? arg->toString() : "null_pointer";
        } else {
            return "unknown_type";
        }
    }, value);
}

std::shared_ptr<ArduinoStruct> createStruct(const std::string& typeName) {
    return std::make_shared<ArduinoStruct>(typeName);
}

std::shared_ptr<ArduinoArray> createArray(const std::string& elementType, const std::vector<size_t>& dimensions) {
    return std::make_shared<ArduinoArray>(elementType, dimensions);
}

std::shared_ptr<ArduinoString> createString(const std::string& initialValue) {
    return std::make_shared<ArduinoString>(initialValue);
}

} // namespace arduino_interpreter