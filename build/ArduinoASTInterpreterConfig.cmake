# ArduinoASTInterpreterConfig.cmake.in - CMake Package Configuration
#
# This file is used by find_package() to locate and configure the
# Arduino AST Interpreter library for external projects.


####### Expanded from @PACKAGE_INIT@ by configure_package_config_file() #######
####### Any changes to this file will be overwritten by the next CMake run ####
####### The input file was ArduinoASTInterpreterConfig.cmake.in                            ########

get_filename_component(PACKAGE_PREFIX_DIR "${CMAKE_CURRENT_LIST_DIR}/../../../" ABSOLUTE)

macro(set_and_check _var _file)
  set(${_var} "${_file}")
  if(NOT EXISTS "${_file}")
    message(FATAL_ERROR "File or directory ${_file} referenced by variable ${_var} does not exist !")
  endif()
endmacro()

macro(check_required_components _NAME)
  foreach(comp ${${_NAME}_FIND_COMPONENTS})
    if(NOT ${_NAME}_${comp}_FOUND)
      if(${_NAME}_FIND_REQUIRED_${comp})
        set(${_NAME}_FOUND FALSE)
      endif()
    endif()
  endforeach()
endmacro()

####################################################################################

include("${CMAKE_CURRENT_LIST_DIR}/ArduinoASTInterpreterTargets.cmake")

# Check that all required components are available
set(ArduinoASTInterpreter_FOUND TRUE)

# Set variables for compatibility
set(ArduinoASTInterpreter_LIBRARIES ArduinoASTInterpreter::arduino_ast_interpreter)
set(ArduinoASTInterpreter_INCLUDE_DIRS "${PACKAGE_PREFIX_DIR}/include/arduino_ast_interpreter")

# Provide information about the build configuration
set(ArduinoASTInterpreter_VERSION "1.0.0")
set(ArduinoASTInterpreter_BUILD_TYPE "Debug")

# Check required C++ standard
if(CMAKE_CXX_STANDARD LESS 17)
    set(ArduinoASTInterpreter_FOUND FALSE)
    set(ArduinoASTInterpreter_NOT_FOUND_MESSAGE "Arduino AST Interpreter requires C++17 or later")
endif()

check_required_components(ArduinoASTInterpreter)
