#pragma once

#include <Effekseer.h>

#include <stdlib.h>

static void ArrayToMatrix44(const float* array, Effekseer::Matrix44& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 4; j++)
		{
			matrix.Values[i][j] = array[i * 4 + j];
		}
	}
}

static void ArrayToMatrix43(const float* array, Effekseer::Matrix43& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			matrix.Value[i][j] = array[i * 4 + j];
		}
	}
}

static bool isEffekseerLogEnabled = false;

static void SetLogEnabled(bool flag) { isEffekseerLogEnabled = flag; }

static void PrintEffekseerLog(const std::string& message)
{
	if (isEffekseerLogEnabled)
	{
		printf("%s\n", message.c_str());
	}
}