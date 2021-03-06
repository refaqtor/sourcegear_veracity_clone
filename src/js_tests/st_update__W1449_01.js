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

load("../js_test_lib/vscript_test_lib.js");

/////////////////////////////////////////////////////////////////////////////////////

var globalThis;  // var to hold "this" pointers

function st_update__W1449_01() 
{
    this.my_group = "st_update__W1449_01";	// this variable must match the above group name.
    this.no_setup = true;		// do not create an initial REPO and WD.

    //////////////////////////////////////////////////////////////////

    load("update_helpers.js");          // load the helper functions
    initialize_update_helpers(this);    // initialize helper functions

    //////////////////////////////////////////////////////////////////

    this.unique = this.my_group + "_" + new Date().getTime();

    this.repoName = this.unique;
    this.rootDir = pathCombine(tempDir, this.unique);
    this.wdDirs = [];
    this.nrWD = 0;
    this.my_names = new Array;

    this.my_make_wd = function()
    {
	var new_wd = pathCombine(this.rootDir, "wd_" + this.nrWD);

	print("Creating WD[" + this.nrWD + "]: " + new_wd);
	print("");

	this.do_fsobj_mkdir_recursive( new_wd );
	this.do_fsobj_cd( new_wd );
	this.wdDirs.push( new_wd );
	
	this.nrWD += 1;

	return new_wd;
    }

    this.my_commit = function(name)
    {
	print("================================");
	print("Attempting COMMIT for: " + name);
	print("");

	sg.exec(vv, "branch", "attach", "master");
	this.my_names[name] = vscript_test_wc__commit(name);
    }
    
    this.my_partial_commit = function(name, path)
    {
	print("================================");
	print("Attempting PARTIAL COMMIT for: " + name + " with: " + path);
	print("");

	sg.exec(vv, "branch", "attach", "master");
	this.my_names[name] = vscript_test_wc__commit_np( { "message" : name, "src" : path } );
    }
    
    this.my_update = function(name)
    {
	print("================================");
	print("Attempting UPDATE to: " + name);
	print("");

	vscript_test_wc__update(this.my_names[name]);
    }

    this.my_merge = function(name)
    {
	print("================================");
	print("Attempting MERGE with: " + name);
	print("");

	vscript_test_wc__merge_np( { "rev" : this.my_names[name], "allow_dirty" : true } );
    }

    this.my_update__expect_error = function(name, msg)
    {
	print("================================");
	print("Attempting UPDATE to: " + name);
	print("");

	vscript_test_wc__update__expect_error(this.my_names[name], msg);
    }

    this.my_find_unique_path = function(pattern)
    {
	// given simple pattern, such as "@/b3/a3*", find the
	// actual current pathname for the item (which might
	// be of the form "@/b3/a3/~g123456~") such that
	// the caller can pass it to a command that takes an
	// exact name.

	var re = new RegExp( pattern );
	var status = sg.wc.status();
	for (var s_index in status)
	    if (re.test(status[s_index].path))
		return (status[s_index].path);

	return; // undefined
    }

    this.my_random = function(limit)
    {
	// return a number between [0..limit-1]
	return (Math.floor(Math.random()*limit));
    }

    //////////////////////////////////////////////////////////////////

    this.test_it = function()
    {
	//////////////////////////////////////////////////////////////////
	// Create the first WD and initialize the REPO.

	this.my_make_wd();
	sg.vv2.init_new_repo( { "repo" : this.repoName,
				"hash" : "SHA1/160",
				"path" : "."
			      } );
	whoami_testing(this.repoName);

	//////////////////////////////////////////////////////////////////
	vscript_test_wc__print_section_divider("testing DELETE-VS-MOVE on 'a'");
	// We do this with 2 sets of items so that we can test RESOLVE taking
	// both choices.

	this.do_fsobj_mkdir("QQQ0");
        vscript_test_wc__addremove();
        this.my_commit("LCA");

	this.do_fsobj_mkdir("QQQ0/QQQ1");
	this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2");
	this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2/QQQ3");
        this.do_fsobj_mkdir("a1");
        this.do_fsobj_mkdir("a2");
        this.do_fsobj_mkdir("a3");
        this.do_fsobj_mkdir("a4");
        this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2/QQQ3/b1");
        this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2/QQQ3/b2");
        this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2/QQQ3/b3");
        this.do_fsobj_mkdir("QQQ0/QQQ1/QQQ2/QQQ3/b4");
        vscript_test_wc__addremove();
        this.my_commit("X0");

	vscript_test_wc__move("a1", "QQQ0/QQQ1/QQQ2/QQQ3/b1");
	vscript_test_wc__move("a2", "QQQ0/QQQ1/QQQ2/QQQ3/b2");
	vscript_test_wc__remove( "a3" );
	vscript_test_wc__remove( "a4" );
        this.my_commit("X1");

	// In this test, I deleted the X2 changes
	// which compound the conflicts from X1.
	// The following are all independent of the
	// X0, X0+dirt, X1 mess.
	//
	// but we also rename a parent directory to see what happens.

        this.do_fsobj_mkdir("d1");
        this.do_fsobj_mkdir("d2");
	vscript_test_wc__rename("QQQ0", "RRR0");
        vscript_test_wc__addremove();
        this.my_commit("X3");

        this.do_fsobj_mkdir("e1");
        this.do_fsobj_mkdir("e2");
        vscript_test_wc__addremove();
        this.my_commit("X4");

	//////////////////////////////////////////////////////////////////
	// backup to LCA and create an alternate head.

	this.my_update("LCA");
        this.do_fsobj_mkdir("z1");
        this.do_fsobj_mkdir("z2");
	vscript_test_wc__rename("QQQ0", "TTT0");
        vscript_test_wc__addremove();
        this.my_commit("Y1");

	//////////////////////////////////////////////////////////////////
	vscript_test_wc__print_section_divider("Create dirt in X0");
	//////////////////////////////////////////////////////////////////
	// backup to X0 and create some dirt/conflicts

	this.my_update("X0");

	var expect_test = new Array;
	vscript_test_wc__confirm_wii(expect_test);

	vscript_test_wc__remove( "a1" );
	vscript_test_wc__remove( "a2" );
	vscript_test_wc__move("a3", "QQQ0/QQQ1/QQQ2/QQQ3/b3");		// now have @/b3/a3
	vscript_test_wc__move("a4", "QQQ0/QQQ1/QQQ2/QQQ3/b4");		// now have @/b4/a4

	//////////////////////////////////////////////////////////////////
	vscript_test_wc__print_section_divider("Dirty update to X1");
	//////////////////////////////////////////////////////////////////
	// do dirty update to X1 (which should create conflicts)
	// and the details are X1-relative due to the change of basis.

	this.my_update("X1");

	var expect_test = new Array;
	expect_test["Added (Update)"]  = [ "@/QQQ0/QQQ1/QQQ2/QQQ3/b3/a3",	// WD dirt in caused them to be kept, so they
					   "@/QQQ0/QQQ1/QQQ2/QQQ3/b4/a4" ];	// appear as added-by-update relative to X1.
	expect_test["Unresolved"]     = [ "@/QQQ0/QQQ1/QQQ2/QQQ3/b1/a1",
					  "@/QQQ0/QQQ1/QQQ2/QQQ3/b2/a2",
					  "@/QQQ0/QQQ1/QQQ2/QQQ3/b3/a3",
					  "@/QQQ0/QQQ1/QQQ2/QQQ3/b4/a4" ];
	expect_test["Choice Unresolved (Existence)"] = [ "@/QQQ0/QQQ1/QQQ2/QQQ3/b1/a1",
							 "@/QQQ0/QQQ1/QQQ2/QQQ3/b2/a2",
							 "@/QQQ0/QQQ1/QQQ2/QQQ3/b3/a3",
							 "@/QQQ0/QQQ1/QQQ2/QQQ3/b4/a4" ];
	vscript_test_wc__confirm_wii(expect_test);

	vscript_test_wc__resolve__list_all();
	// Existence:  @/QQQ0/QQQ1/QQQ2/QQQ3/b1/a1/
	// Existence:  @/QQQ0/QQQ1/QQQ2/QQQ3/b2/a2/
	// Existence:  @/QQQ0/QQQ1/QQQ2/QQQ3/b3/a3/
	// Existence:  @/QQQ0/QQQ1/QQQ2/QQQ3/b4/a4/

	vscript_test_wc__resolve__list_all_verbose();
	// TODO....

	//////////////////////////////////////////////////////////////////
	vscript_test_wc__print_section_divider("Dirty update to X3");
	//////////////////////////////////////////////////////////////////
	// W8402 asks if we can do a DIRTY UPDATE with UNRESOLVED ISSUES.
	// W2065 asks if we can do a DIRTY UPDATE with RESOLVED ISSUES.
	//
	// W2065: If the item has resolved status, we can drop the issue
	// during the update (like commit would).
	//
	// Since X3 is completely independent of the {X0, X0+dirt, X1} mess,
	// we should be able to update without any problems and all of the
	// existing issues should carry-forward.

	this.my_update("X3");

	var expect_test = new Array;
	expect_test["Added (Update)"]  = [ "@/RRR0/QQQ1/QQQ2/QQQ3/b3/a3",
					   "@/RRR0/QQQ1/QQQ2/QQQ3/b4/a4" ];
	expect_test["Unresolved"]     = [ "@/RRR0/QQQ1/QQQ2/QQQ3/b1/a1",
					  "@/RRR0/QQQ1/QQQ2/QQQ3/b2/a2",
					  "@/RRR0/QQQ1/QQQ2/QQQ3/b3/a3",
					  "@/RRR0/QQQ1/QQQ2/QQQ3/b4/a4" ];
	expect_test["Choice Unresolved (Existence)"] = [ "@/RRR0/QQQ1/QQQ2/QQQ3/b1/a1",
							 "@/RRR0/QQQ1/QQQ2/QQQ3/b2/a2",
							 "@/RRR0/QQQ1/QQQ2/QQQ3/b3/a3",
							 "@/RRR0/QQQ1/QQQ2/QQQ3/b4/a4" ];
	vscript_test_wc__confirm_wii(expect_test);

	vscript_test_wc__resolve__list_all();
	// Existence:  @/RRR0/QQQ1/QQQ2/QQQ3/b1/a1/
	// Existence:  @/RRR0/QQQ1/QQQ2/QQQ3/b2/a2/
	// Existence:  @/RRR0/QQQ1/QQQ2/QQQ3/b3/a3/
	// Existence:  @/RRR0/QQQ1/QQQ2/QQQ3/b4/a4/

	vscript_test_wc__resolve__list_all_verbose();

	//////////////////////////////////////////////////////////////////	
	vscript_test_wc__print_section_divider("Merge Y1 into X3+dirt");
	//////////////////////////////////////////////////////////////////
	// W7720 asks if we can do a MERGE with outstanding resolved/unresolved 
	// issues.
	//
	// Merge Y1 into X3+dirt.  This will carry-forward the unresolved
	// conflicts *AND* create new ones for the conflicts that MERGE
	// found.
	//
	// W1449 asks about how we label the choices in each unresolved issue.

	this.my_merge("Y1");

	var expect_test = new Array;
	expect_test["Added (Merge)"]  = [ "@/z1",
					  "@/z2" ];
	expect_test["Added (Update)"]  = [ "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b3/a3",
					   "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b4/a4" ];
	expect_test["Renamed"]        = [ "@/RRR0~g[0-9a-f]*" ];
	expect_test["Unresolved"]     = [ "@/RRR0~g[0-9a-f]*",
					  "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b1/a1",
					  "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b2/a2",
					  "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b3/a3",
					  "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b4/a4" ];
	expect_test["Choice Unresolved (Name)"]      = [ "@/RRR0~g[0-9a-f]*" ];
	expect_test["Choice Unresolved (Existence)"] = [ "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b1/a1",
							 "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b2/a2",
							 "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b3/a3",
							 "@/RRR0~g[0-9a-f]*/QQQ1/QQQ2/QQQ3/b4/a4" ];
	vscript_test_wc__confirm_wii(expect_test);


	vscript_test_wc__resolve__list_all();
	// Existence:  @/RRR0~g75ac0d/QQQ1/QQQ2/QQQ3/b1/a1/
	// Existence:  @/RRR0~g75ac0d/QQQ1/QQQ2/QQQ3/b2/a2/
	// Existence:  @/RRR0~g75ac0d/QQQ1/QQQ2/QQQ3/b3/a3/
	// Existence:  @/RRR0~g75ac0d/QQQ1/QQQ2/QQQ3/b4/a4/
	//      Name:  @/RRR0~g75ac0d/

	vscript_test_wc__resolve__list_all_verbose();


    }
}
