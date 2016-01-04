/*
Copyright 2010-2013 SourceGear, LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#include "precompiled.h"
#include "vvDiffThread.h"
#include "wx/thread.h"
#include "vvContext.h"

wxThread::ExitCode vvDiffThread::Entry()
{
	vvContext newContext;  
	m_pCommand->SetContext(&newContext);
	m_pCommand->Execute();
	return (wxThread::ExitCode)0;
}

void vvDiffThread::OnExit()
{
	delete m_pCommand;
}